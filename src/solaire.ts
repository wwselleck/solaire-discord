import Discord from "discord.js";
import { Command, parseCommandString } from "./command";
import { CommandCollection } from "./command-collection";

type SolaireCommands = Record<string, Pick<Command, "execute">>;

interface SolaireConfig {
  token: string;
  commandPrelude?: string;
  commands?: SolaireCommands;
}

export class Solaire {
  private commands: CommandCollection;

  constructor(
    private discordClient: Discord.Client,
    private config: SolaireConfig
  ) {
    const commands =
      Object.entries(config.commands ?? {})?.map(([cmd, cmdConfig]) => {
        const { name, aliases, args } = parseCommandString(cmd);
        return {
          name,
          aliases,
          args,
          ...cmdConfig,
        };
      }) ?? [];
    this.commands = new CommandCollection(commands, {
      prelude: config.commandPrelude,
    });
  }

  static create(config: SolaireConfig) {
    const discordClient = new Discord.Client({
      partials: ["MESSAGE", "REACTION"],
    });

    return new Solaire(discordClient, config);
  }

  start() {
    this.discordClient.login(this.config.token);
    this.discordClient.on("message", (message) => this._onMessage(message));
  }

  _onMessage(message: Discord.Message) {
    this.commands.processMessage(message);
  }
}
