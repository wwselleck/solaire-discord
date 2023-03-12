import { ExecutableCommandCollection } from '../executable-command-collection';

const MockCommands = () => ({
  standard: {
    command: {
      name: 'standard'
    },
    execute: jest.fn()
  },
  hasAlias: {
    command: {
      name: 'hasAlias',
      aliases: ['hasAl']
    },
    execute: jest.fn()
  }
});

describe('ExecutableCommandCollection', () => {
  let mockCommands: ReturnType<typeof MockCommands>;

  beforeEach(() => {
    mockCommands = MockCommands();
  });

  describe('get', () => {
    it('gets a command by its name', () => {
      const commands = new ExecutableCommandCollection();
      commands.add(mockCommands.standard);
      const command = commands.get('standard');
      expect(command).toEqual(mockCommands.standard);
    });

    it('gets a command by alias', () => {
      const commands = new ExecutableCommandCollection();
      commands.add(mockCommands.hasAlias);
      const command = commands.get('hasAl');
      expect(command).toEqual(mockCommands.hasAlias);
    });
  });
});
