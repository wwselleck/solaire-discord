import Discord from 'discord.js';
import { Solaire } from '../src/solaire';
import { MockMessage, MockDiscordClient } from './discord-mocks';
import { flushPromises } from './async';

export const SolaireTester = (
  solaireConfig: Omit<ConstructorParameters<typeof Solaire>[1], 'token'>
) => {
  const mockDiscordClient = new MockDiscordClient() as Discord.Client;
  const solaire = new Solaire(mockDiscordClient, {
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
