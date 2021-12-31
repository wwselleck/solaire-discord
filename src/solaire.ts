import Discord from 'discord.js';
import EventEmitter from 'events';
import { Command, CommandArg, parseCommandString } from './command';
import { CommandCollection } from './command-collection';
import { CommandRunner } from './command-runner';

type SolaireCommands = Record<string, Pick<Command, 'execute' | 'guard'>>;

interface SolaireConfig {
  discordClient: Discord.Client;

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
  commands?: SolaireCommandsConfig;
}

export class Solaire extends EventEmitter {
  private commands: CommandCollection;
  private runner: CommandRunner;

  constructor(private config: SolaireConfig) {
    super();
    const commands =
      Object.entries(config.commands ?? {})?.map(([cmd, cmdConfig]) => {
        const { name, aliases, args } = parseCommandString(cmd);
        return {
          ...cmdConfig,
          name,
          aliases,
          args
        };
      }) ?? [];

    this.commands = new CommandCollection(commands);

    this.runner = new CommandRunner(this.commands, {
      prelude: config.commandPrelude,
      cooldown: config.commandCooldown
    });
  }

  static create(config: SolaireConfig) {
    return new Solaire(config);
  }

  start() {
    this.config.discordClient.login(this.config.token);
    this.config.discordClient.on('message', (message) =>
      this._onMessage(message)
    );
  }

  ejectDiscordClient() {
    return this.config.discordClient;
  }

  async _onMessage(message: Discord.Message) {
    const result = await this.runner.processMessage(message);
    if (result.commandInvoked) {
      this.emit('commandInvokedEnd', result);
    }
  }
}
