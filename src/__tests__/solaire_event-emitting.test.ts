import { SolaireTester } from '../../test/solaire-tester';

jest.useFakeTimers('modern');

describe('Solaire - Event Emitting', () => {
  describe('command invocation', () => {
    describe('commandInvokedEnd', () => {
      it('emitted when a command is invoked with a missing required arg', async () => {
        const { solaire, sendMessage } = SolaireTester({
          commands: {
            'test <requiredArg>': {
              execute: jest.fn()
            }
          }
        });

        const eventListener = jest.fn();
        solaire.on('commandInvokedEnd', eventListener);
        await sendMessage('test');

        expect(eventListener).toHaveBeenCalledWith({
          success: false,
          commandInvoked: true,
          command: expect.objectContaining({
            name: 'test'
          }),
          message: expect.any(Object),
          error: {
            type: 'missing-required-arg',
            commandArg: expect.objectContaining({
              name: 'requiredArg'
            })
          }
        });
      });

      it('emitted when a command is invoked with an invalid arg value', async () => {
        const { solaire, sendMessage } = SolaireTester({
          commands: {
            'test <requiredArg:Int>': {
              execute: jest.fn()
            }
          }
        });

        const eventListener = jest.fn();
        solaire.on('commandInvokedEnd', eventListener);
        await sendMessage('test oopsnotanint');

        expect(eventListener).toHaveBeenCalledWith({
          success: false,
          commandInvoked: true,
          command: expect.objectContaining({
            name: 'test'
          }),
          message: expect.any(Object),
          error: {
            type: 'invalid-arg-value',
            commandArg: expect.objectContaining({
              name: 'requiredArg'
            }),
            providedValue: 'oopsnotanint'
          }
        });
      });

      it('emitted when a command is invoked by a user who does not pass the guard test', async () => {
        const { solaire, sendMessage } = SolaireTester({
          commands: {
            test: {
              execute: jest.fn(),
              guard: ({ error }) => error()
            }
          }
        });

        const eventListener = jest.fn();
        solaire.on('commandInvokedEnd', eventListener);
        await sendMessage('test oopsnotanint');

        expect(eventListener).toHaveBeenCalledWith({
          success: false,
          commandInvoked: true,
          command: expect.objectContaining({
            name: 'test'
          }),
          message: expect.any(Object),
          error: {
            type: 'blocked-by-guard'
          }
        });
      });

      it('emitted when a command is on cooldown', async () => {
        const { solaire, sendMessage } = SolaireTester({
          commandCooldown: 1000,
          commands: {
            test: {
              execute: jest.fn()
            }
          }
        });

        const eventListener = jest.fn();
        solaire.on('commandInvokedEnd', eventListener);
        await sendMessage('test');
        await sendMessage('test');

        expect(eventListener).toHaveBeenCalledWith({
          success: false,
          commandInvoked: true,
          command: expect.objectContaining({
            name: 'test'
          }),
          message: expect.any(Object),
          error: {
            type: 'cooldown-in-effect'
          }
        });
      });

      it('emitted when an command execute fn throws an error', async () => {
        const { solaire, sendMessage } = SolaireTester({
          commands: {
            test: {
              execute: () => {
                throw new Error('oopsy');
              }
            }
          }
        });

        const eventListener = jest.fn();
        solaire.on('commandInvokedEnd', eventListener);
        await sendMessage('test');

        expect(eventListener).toHaveBeenCalledWith({
          success: false,
          commandInvoked: true,
          command: expect.objectContaining({
            name: 'test'
          }),
          message: expect.any(Object),
          error: {
            type: 'unhandled-command-execution-error',
            error: expect.objectContaining({
              message: 'oopsy'
            })
          }
        });
      });
    });
  });
});
