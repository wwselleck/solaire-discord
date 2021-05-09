import Discord from "discord.js";
import { Command, CommandExecuteArgs, parseCommandString } from "./command";
import { CommandCollection } from "./command-collection";
import { CommandArgs } from "./command-parser-types";
import { CommandRunner } from "./command-runner";

interface SolaireConfig<K extends string> {
  /**
   * Discord bot user token
   */
  token: string;

  /**
   * The text that a command invocation must start with.
   *
   * Example:
   *   For a command named `echo` and a commandPrelude of `'!'`, the message
   *
   *     echo Hello world!
   *
   *   will not execute the `echo` command, because it did not start with the `'!'`
   *   prelude.
   *
   *     !echo Hello world!
   *
   *   This message would invoke the `echo` command.
   */
  commandPrelude?: string;

  /**
   * The default cooldown for all commands, in milliseconds.
   */
  commandCooldown?: number;

  /**
   * The commands to initialize the bot with
   */
  commands?: {
    [P in K]: {
      execute(
        payload: Exclude<CommandExecuteArgs, "args"> & { args: CommandArgs<P> }
      ): void;
    };
  };
}

export class Solaire<T extends string> {
  private commands: CommandCollection;
  private runner: CommandRunner;

  constructor(
    private discordClient: Discord.Client,
    private config: SolaireConfig<T>
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

    this.commands = new CommandCollection(commands);

    this.runner = new CommandRunner(this.commands, {
      prelude: config.commandPrelude,
      cooldown: config.commandCooldown,
    });
  }

  static create<K extends string>(config: SolaireConfig<K>) {
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
    this.runner.processMessage(message);
  }
}
