import Discord from 'discord.js';
import { Command, parseCommandString } from '../command';
import {
  ExecutableCommandCollection,
  ExecuteFn,
  GuardFn
} from '../executable-command-collection';
import { parseCommandMessage, buildExecuteArgs } from '../command-processing';
import {
  CommandInvocationError,
  CooldownInEffect,
  BlockedByGuard,
  UnhandledCommandExecutionError
} from '../command-invocation-error';

import { SolaireMode, MessageHandleResult } from './mode';
import EventEmitter from 'events';

interface CommandRunLog {
  command: Command;
  date: Date;
}

class CommandRunHistory {
  private logs: CommandRunLog[];
  constructor() {
    this.logs = [];
  }

  addRun(log: CommandRunLog) {
    this.logs.unshift(log);
  }

  latestRunOfCommand(command: Command) {
    for (const log of this.logs) {
      if (log.command.name === command.name) {
        return log;
      }
    }
    return null;
  }
}

export interface SolairePreludeConfig {
  discordClient: Discord.Client;
  mode: 'prelude';

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
  prelude: string;

  /**
   * The default cooldown for all commands, in milliseconds.
   */
  cooldown?: number;

  /**
   * The commands to initialize the bot with
   */
  commands: Record<
    string,
    {
      execute: ExecuteFn<'prelude'>;
      guard: GuardFn<'prelude'>;
    }
  >;
}

export class PreludeMode extends EventEmitter implements SolaireMode {
  private history: CommandRunHistory;
  private executableCommands: ExecutableCommandCollection<'prelude'>;
  constructor(
    private config: SolairePreludeConfig,
    private options?: { prelude?: string; cooldown?: number }
  ) {
    super();
    this.history = new CommandRunHistory();
    this.executableCommands = new ExecutableCommandCollection();
    for (const [cmdString, cmdConfig] of Object.entries(config.commands)) {
      const command = parseCommandString(cmdString);
      this.executableCommands.add({
        command,
        execute: cmdConfig.execute,
        guard: cmdConfig.guard
      });
    }
  }

  async start() {
    this.config.discordClient.on(
      'message',
      async (message: Discord.Message) => {
        const result = await this.processMessage(message);
        console.log(result);
        if (result.commandInvoked) {
          if (
            'error' in result &&
            result.error instanceof UnhandledCommandExecutionError
          ) {
            throw result.error;
          }
          this.emit('commandInvokedEnd', result);
        }
      }
    );
  }

  async processMessage(message: Discord.Message): Promise<MessageHandleResult> {
    console.log(this.config);
    const parsedCommandMessage = parseCommandMessage(
      message.content,
      this.config.prelude
    );

    // Could not parse message into a command call,
    // no need to handle
    if (!parsedCommandMessage.success) {
      return {
        success: true,
        preludeIncluded: false,
        commandInvoked: false,
        message
      };
    }

    console.log(parsedCommandMessage);
    const executableCommand = this.executableCommands.get(
      parsedCommandMessage.result.name
    );

    console.log(executableCommand);
    if (!executableCommand) {
      return {
        success: true,
        preludeIncluded: true,
        commandInvoked: false,
        message
      };
    }

    if (this.options?.cooldown && this.options.cooldown > 0) {
      const mostRecentRun = this.history.latestRunOfCommand(
        executableCommand.command
      );
      if (mostRecentRun) {
        const diffMs = Date.now() - mostRecentRun?.date.getTime();
        if (diffMs < this.options.cooldown) {
          return {
            success: false,
            message,
            commandInvoked: true,
            command: executableCommand.command,
            error: CooldownInEffect()
          };
        }
      }
    }

    let executeArgs;
    try {
      executeArgs = buildExecuteArgs(
        message,
        parsedCommandMessage.result.args,
        executableCommand.command
      );
    } catch (e) {
      return {
        success: false,
        message,
        commandInvoked: true,
        command: executableCommand.command,
        error: e as CommandInvocationError
      };
    }

    if (!executeArgs) {
      throw new Error('executeArgs was falsey somehow');
    }

    const payload = { args: executeArgs, message, interaction: undefined };

    if (executableCommand.guard) {
      let ok = false;
      let error = null;
      const guardPayload = {
        ...payload,
        ok: () => (ok = true),
        error: (err?: any) => (error = err)
      };

      await executableCommand.guard(guardPayload);

      // Eventually need to re-structure to report error object to
      // some error listener
      if (error || !ok) {
        if (!error) {
          console.warn(
            `guard() function for command ${executableCommand.command.name} did not call ok() or error(), defaulting to no access`
          );
        }

        return {
          success: false,
          command: executableCommand.command,
          commandInvoked: true,
          message,
          error: BlockedByGuard(error)
        };
      }
    }

    try {
      await executableCommand.execute(payload);
    } catch (e) {
      return {
        success: false,
        command: executableCommand.command,
        commandInvoked: true,
        message,
        error: UnhandledCommandExecutionError(e)
      };
    }
    this.history.addRun({
      command: executableCommand.command,
      date: new Date()
    });
    return {
      success: true,
      command: executableCommand.command,
      commandInvoked: true,
      message
    };
  }
}
