import Discord from 'discord.js';
import { CommandRunner } from '../command-runner';
import { CommandCollection } from '../command-collection';
import { MissingRequiredArgError, InvalidArgValueError } from '../error';

jest.useFakeTimers('modern');

const MockMessage = (content: string) => {
  return {
    content,
    reply: jest.fn()
  } as unknown as Discord.Message;
};

const MockCommands = () => ({
  standard: {
    name: 'standard',
    execute: jest.fn()
  },
  standard2: {
    name: 'standard2',
    execute: jest.fn()
  },
  hasAlias: {
    name: 'hasAlias',
    aliases: ['hasAl'],
    execute: jest.fn()
  },
  oneRequiredArg: {
    name: 'oneRequiredArg',
    args: [
      {
        name: 'arg1',
        required: true
      }
    ],
    execute: jest.fn()
  },
  twoRequiredArgs: {
    name: 'twoRequiredArgs',
    args: [
      {
        name: 'arg1',
        required: true
      },
      {
        name: 'arg2',
        required: true
      }
    ],
    execute: jest.fn()
  },
  noOneCanRun: {
    name: 'noOneCanRun',
    execute: jest.fn(),
    guard: jest.fn(() => {
      throw new Error('nope');
    })
  },
  everyoneCanRun: {
    name: 'everyoneCanRun',
    execute: jest.fn(),
    guard: jest.fn()
  }
});

describe('CommandRunner', () => {
  let mockCommands: ReturnType<typeof MockCommands>;

  beforeEach(() => {
    mockCommands = MockCommands();
  });

  describe('processMessage', () => {
    it('executes correct command', () => {
      const runner = new CommandRunner(
        new CommandCollection([mockCommands.standard])
      );
      const msg = MockMessage('standard');
      runner.processMessage(msg);
      expect(mockCommands.standard.execute).toHaveBeenCalled();
    });

    it('doesnt execute commands that were not called in the message', () => {
      const runner = new CommandRunner(
        new CommandCollection([mockCommands.standard, mockCommands.standard2])
      );
      const msg = MockMessage('standard');
      runner.processMessage(msg);
      expect(mockCommands.standard.execute).toHaveBeenCalled();
      expect(mockCommands.standard2.execute).not.toHaveBeenCalled();
    });

    describe('command prelude', () => {
      it('does not execute a command if the message did not include the prelude', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.standard]),
          {
            prelude: '!'
          }
        );
        const msg = MockMessage('standard');
        runner.processMessage(msg);
        expect(mockCommands.standard.execute).not.toHaveBeenCalled();
      });

      it('does executes a command if the message did include the prelude', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.standard]),
          {
            prelude: '!'
          }
        );
        const msg = MockMessage('!standard');
        runner.processMessage(msg);
        expect(mockCommands.standard.execute).toHaveBeenCalled();
      });
    });

    describe('command aliases', () => {
      it('executes a command if one of its aliases was used', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.hasAlias])
        );
        const msg = MockMessage('hasAl');
        runner.processMessage(msg);
        expect(mockCommands.hasAlias.execute).toHaveBeenCalled();
      });
    });

    describe('arguments', () => {
      it('passes a required argument to the handler', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.oneRequiredArg])
        );
        const msg = MockMessage('oneRequiredArg testArg');
        runner.processMessage(msg);
        expect(mockCommands.oneRequiredArg.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: {
              arg1: 'testArg'
            }
          })
        );
      });

      it('throws if a required arg is missing', async () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.oneRequiredArg])
        );
        const msg = MockMessage('oneRequiredArg');
        await expect(runner.processMessage(msg)).rejects.toThrow(
          MissingRequiredArgError
        );
        expect(mockCommands.oneRequiredArg.execute).not.toHaveBeenCalled();
      });

      it('throws if one of multiple required args is missing', async () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.twoRequiredArgs])
        );
        const msg = MockMessage('twoRequiredArgs test1');
        await expect(runner.processMessage(msg)).rejects.toThrow(
          MissingRequiredArgError
        );
        expect(mockCommands.twoRequiredArgs.execute).not.toHaveBeenCalled();
      });
    });

    describe('cooldown', () => {
      it('blocks command execution if a general cooldown is set and not enough time has surpassed', async () => {
        const startTime = 1349852318000;
        jest.setSystemTime(startTime);

        const runner = new CommandRunner(
          new CommandCollection([mockCommands.standard]),
          {
            cooldown: 5000
          }
        );

        await runner.processMessage(MockMessage('standard'));
        expect(mockCommands.standard.execute).toHaveBeenCalledTimes(1);
        await runner.processMessage(MockMessage('standard'));
        expect(mockCommands.standard.execute).toHaveBeenCalledTimes(1);
      });

      it('allows command execution if general cooldown is set and enough time has surpassed', async () => {
        const cooldown = 5000;

        const startTime = 1349852318000;
        jest.setSystemTime(startTime);

        const runner = new CommandRunner(
          new CommandCollection([mockCommands.standard]),
          {
            cooldown
          }
        );

        await runner.processMessage(MockMessage('standard'));
        expect(mockCommands.standard.execute).toHaveBeenCalledTimes(1);

        jest.setSystemTime(startTime + cooldown - 1);
        await runner.processMessage(MockMessage('standard'));
        expect(mockCommands.standard.execute).toHaveBeenCalledTimes(1);

        jest.setSystemTime(startTime + cooldown);
        await runner.processMessage(MockMessage('standard'));
        expect(mockCommands.standard.execute).toHaveBeenCalledTimes(2);
      });
    });
    describe('guard', () => {
      it('calls guard if provided', async () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.noOneCanRun])
        );
        await expect(
          runner.processMessage(MockMessage('noOneCanRun'))
        ).rejects.toThrow();
        expect(mockCommands.noOneCanRun.guard).toHaveBeenCalled();
      });

      it('throws if guard throws', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.noOneCanRun])
        );
        expect(
          runner.processMessage(MockMessage('noOneCanRun'))
        ).rejects.toThrow();
      });

      it('does not throw if guard exists but does not throw', () => {
        const runner = new CommandRunner(
          new CommandCollection([mockCommands.everyoneCanRun])
        );
        runner.processMessage(MockMessage('everyoneCanRun'));
      });
    });
  });
});
