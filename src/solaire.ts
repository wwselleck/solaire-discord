import Discord from "discord.js";
import { Command } from "./command";

interface SolaireOptions {
  prefix?: string;
  token: string;
}

export class Solaire {
  private commands: Command[];

  constructor(
    private discordClient: Discord.Client,
    private options: SolaireOptions
  ) {
    this.commands = [];
  }

  static create(options: SolaireOptions) {
    const discordClient = new Discord.Client({
      partials: ["MESSAGE", "REACTION"],
    });

    return new Solaire(discordClient, options);
  }

  start() {
    this.discordClient.login(this.options.token);
    this.discordClient.on("message", (message) =>
      this._processMessage(message)
    );
  }

  addCommand(command: Command) {}

  _processMessage(message: Discord.Message) {
    this.commands.forEach(() => {});
  }
}
