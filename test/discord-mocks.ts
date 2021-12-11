import Discord from 'discord.js';
import EventEmitter from 'events';

export const MockGuildMember = () => {
  return { id: 'abc123' };
};

export const MockMessage = (content = '') => {
  return {
    content,
    guild: {
      members: {
        cache: {
          get: (id: string) => {
            if (id === 'abc123') {
              return MockGuildMember();
            }
            return null;
          }
        }
      }
    }
  } as unknown as Discord.Message;
};

export class MockDiscordClient extends EventEmitter {
  login() {}
}
