import Discord from 'discord.js';
import { Solaire } from '../solaire';

const mockDiscordClient = {} as Discord.Client;

describe('Solaire', () => {
  describe('constructor', () => {
    it('should error if given a command string that parses into an invalid command', () => {
      expect(() => {
        new Solaire(mockDiscordClient, {
          token: 'abc',
          commands: {
            'test <testArg> <testArg>': {
              execute() {}
            }
          }
        });
      }).toThrow();
    });
  });
});
