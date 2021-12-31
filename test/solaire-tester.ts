import Discord from 'discord.js';
import { Solaire } from '../src/solaire';
import { MockMessage, MockDiscordClient } from './discord-mocks';
import { flushPromises } from './async';

export const SolaireTester = (
  solaireConfig: Omit<
    ConstructorParameters<typeof Solaire>[0],
    'token' | 'discordClient'
  >
) => {
  const mockDiscordClient = new MockDiscordClient() as Discord.Client;
  const solaire = new Solaire({
    discordClient: mockDiscordClient,
    token: 'abc',
    ...solaireConfig
  });
  solaire.start();
  return {
    solaire,
    sendMessage: async (message: string) => {
      mockDiscordClient.emit('message', MockMessage(message));
      await flushPromises();
    }
  };
};
