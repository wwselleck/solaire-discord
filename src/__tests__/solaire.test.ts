import Discord from 'discord.js';
import { Solaire } from '../solaire';
import {
  MissingRequiredArgError,
  InvalidArgValueError,
  UnhandledCommandExecutionError
} from '../error';
import { MockMessage, MockDiscordClient } from '../../test/discord-mocks';
import { flushPromises } from '../../test/async';

describe('Solaire', () => {
  describe('constructor', () => {
    it('should error if given a command string that parses into an invalid command', () => {
      const mockDiscordClient = new MockDiscordClient() as Discord.Client;
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

  describe('message handling', () => {
    describe('error handling', () => {
      it('should call onError if a required command arg is missing', async () => {
        const mockDiscordClient = new MockDiscordClient() as Discord.Client;
        const onError = jest.fn();
        const solaire = new Solaire(mockDiscordClient, {
          token: 'abc',
          commands: {
            'test <testArg>': {
              execute() {}
            }
          },
          onError
        });

        solaire.start();

        mockDiscordClient.emit('message', MockMessage('test'));
        await flushPromises();
        const firstCall = onError.mock.calls[0];
        expect(firstCall[0]).toBeInstanceOf(MissingRequiredArgError);
      });

      it('should call onError if an arg is provided with an invalid type', async () => {
        const mockDiscordClient = new MockDiscordClient() as Discord.Client;
        const onError = jest.fn();
        const solaire = new Solaire(mockDiscordClient, {
          token: 'abc',
          commands: {
            'test <testArg:Int>': {
              execute() {}
            }
          },
          onError
        });

        solaire.start();

        mockDiscordClient.emit('message', MockMessage('test notAnInt'));
        await flushPromises();
        const firstCall = onError.mock.calls[0];
        expect(firstCall[0]).toBeInstanceOf(InvalidArgValueError);
      });

      it('should call onError if an execute function throws', async () => {
        const mockDiscordClient = new MockDiscordClient() as Discord.Client;
        const onError = jest.fn();
        const solaire = new Solaire(mockDiscordClient, {
          token: 'abc',
          commands: {
            test: {
              execute() {
                throw new Error('oops!');
              }
            }
          },
          onError
        });

        solaire.start();

        mockDiscordClient.emit('message', MockMessage('test'));
        await flushPromises();
        const firstCall = onError.mock.calls[0];
        expect(firstCall[0]).toBeInstanceOf(UnhandledCommandExecutionError);
      });
    });
  });
});
