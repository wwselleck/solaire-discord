import Discord from "discord.js";
import EventEmitter from "events";

export const MockGuildMember = () => {
  return { id: "abc123" };
};

export const MockMessage = () => {
  return ({
    guild: {
      members: {
        cache: {
          get: (id: string) => {
            if (id === "abc123") {
              return MockGuildMember();
            }
            return null;
          },
        },
      },
    },
  } as unknown) as Discord.Message;
};

class _MockDiscordClient extends EventEmitter {
  login() {}
}

export const MockDiscordClient = (_MockDiscordClient as unknown) as Discord.Client;
