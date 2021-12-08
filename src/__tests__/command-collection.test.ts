import { CommandCollection } from '../command-collection';

const MockCommands = () => ({
  standard: {
    name: 'standard',
    execute: jest.fn()
  },
  hasAlias: {
    name: 'hasAlias',
    aliases: ['hasAl'],
    execute: jest.fn()
  }
});

describe('CommandCollection', () => {
  let mockCommands: ReturnType<typeof MockCommands>;

  beforeEach(() => {
    mockCommands = MockCommands();
  });

  describe('getCommand', () => {
    it('gets a command by its name', () => {
      const commands = new CommandCollection([mockCommands.standard]);
      const command = commands.getCommand('standard');
      expect(command).toEqual(mockCommands.standard);
    });

    it('gets a command by alias', () => {
      const commands = new CommandCollection([mockCommands.hasAlias]);
      const command = commands.getCommand('hasAl');
      expect(command).toEqual(mockCommands.hasAlias);
    });
  });
});
