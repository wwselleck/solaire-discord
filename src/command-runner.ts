import Discord from 'discord.js';
import { Command } from './command';
import { CommandCollection } from './command-collection';
import { parseCommandMessage, buildExecuteArgs } from './command-processing';
import {
  CommandInvocationError,
  CooldownInEffect,
  BlockedByGuard,
  UnhandledCommandExecutionError
} from './command-invocation-error';

interface BaseMessageHandleResult {
  message: Discord.Message;
}

interface NoCommandInvoked extends BaseMessageHandleResult {
  success: true;
  commandInvoked: false;
  preludeIncluded: boolean;
}

interface CommandInvokedSuccess extends BaseMessageHandleResult {
  success: true;
  commandInvoked: true;
  command: Command;
}

interface CommandInvokedFailure extends BaseMessageHandleResult {
  success: false;
  commandInvoked: true;
  command: Command;
  error: CommandInvocationError;
}

type MessageHandleResult =
  | NoCommandInvoked
  | CommandInvokedSuccess
  | CommandInvokedFailure;

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

export class CommandRunner {
  private history: CommandRunHistory;
  constructor(
    private commands: CommandCollection,
    private options?: { prelude?: string; cooldown?: number }
  ) {
    this.history = new CommandRunHistory();
  }

  async processMessage(message: Discord.Message): Promise<MessageHandleResult> {
    const parsedCommandMessage = parseCommandMessage(
      message.content,
      this.options?.prelude
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

    const calledCommand = this.commands.getCommand(
      parsedCommandMessage.result.name
    );

    if (!calledCommand) {
      return {
        success: true,
        preludeIncluded: true,
        commandInvoked: false,
        message
      };
    }

    if (this.options?.cooldown && this.options.cooldown > 0) {
      const mostRecentRun = this.history.latestRunOfCommand(calledCommand);
      if (mostRecentRun) {
        const diffMs = Date.now() - mostRecentRun?.date.getTime();
        if (diffMs < this.options.cooldown) {
          return {
            success: false,
            message,
            commandInvoked: true,
            command: calledCommand,
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
        calledCommand
      );
    } catch (e) {
      return {
        success: false,
        message,
        commandInvoked: true,
        command: calledCommand,
        error: e
      };
    }

    if (!executeArgs) {
      throw new Error('executeArgs was falsey somehow');
    }

    const payload = { args: executeArgs, message };

    if (calledCommand.guard) {
      let ok = false;
      let error = null;
      const guardPayload = {
        ...payload,
        ok: () => (ok = true),
        error: (err?: any) => (error = err)
      };

      await calledCommand.guard(guardPayload);

      // Eventually need to re-structure to report error object to
      // some error listener
      if (error || !ok) {
        if (!error) {
          console.warn(
            `guard() function for command ${calledCommand.name} did not call ok() or error(), defaulting to no access`
          );
        }

        return {
          success: false,
          command: calledCommand,
          commandInvoked: true,
          message,
          error: BlockedByGuard(error)
        };
      }
    }

    try {
      await calledCommand.execute(payload);
    } catch (e) {
      return {
        success: false,
        command: calledCommand,
        commandInvoked: true,
        message,
        error: UnhandledCommandExecutionError(e)
      };
    }
    this.history.addRun({
      command: calledCommand,
      date: new Date()
    });
    return {
      success: true,
      command: calledCommand,
      commandInvoked: true,
      message
    };
  }
}
