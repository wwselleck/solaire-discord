import Discord from 'discord.js';
import { Command } from './command';
import { CommandCollection } from './command-collection';
import { parseCommandMessage, buildExecuteArgs } from './command-processing';
import { UnhandledCommandExecutionError } from './error';

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

  async processMessage(message: Discord.Message) {
    const parsedCommandMessage = parseCommandMessage(
      message.content,
      this.options?.prelude
    );

    // Could not parse message into a command call,
    // no need to handle
    if (!parsedCommandMessage.success) {
      return;
    }

    const calledCommand = this.commands.getCommand(
      parsedCommandMessage.result.name
    );

    if (!calledCommand) {
      //handle eventually
      return;
    }

    if (this.options?.cooldown && this.options.cooldown > 0) {
      const mostRecentRun = this.history.latestRunOfCommand(calledCommand);
      if (mostRecentRun) {
        const diffMs = Date.now() - mostRecentRun?.date.getTime();
        if (diffMs < this.options.cooldown) {
          return;
        }
      }
    }

    const executeArgs = buildExecuteArgs(
      message,
      parsedCommandMessage.result.args,
      calledCommand
    );

    const payload = { args: executeArgs, message };

    if (calledCommand.guard) {
      // Will throw if user cannot execute command
      await calledCommand.guard(payload);
    }

    try {
      await calledCommand.execute(payload);
    } catch (e) {
      throw new UnhandledCommandExecutionError({
        command: calledCommand,
        unhandledError: e,
        invokingMessage: message
      });
    }
    this.history.addRun({
      command: calledCommand,
      date: new Date()
    });
  }
}
