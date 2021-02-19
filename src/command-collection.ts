import Discord from "discord.js";
import { Command } from "./command";
import {
  parseCommandMessage,
  buildExecuteArgs,
  MissingRequiredArgumentError,
} from "./command-processing";

const replyWithError = (message: Discord.Message, error: Error) => {
  message.reply(error.message);
};

export class CommandCollection {
  private options: { prelude?: string };

  constructor(private commands: Command[], options: { prelude?: string }) {
    this.options = options ?? {};
  }

  addCommand(command: Command) {
    this.commands.push(command);
  }

  processMessage(message: Discord.Message) {
    const parsedCommandMessage = parseCommandMessage(
      message.content,
      this.options.prelude
    );

    // Could not parse message into a command call,
    // no need to handle
    if (!parsedCommandMessage.success) {
      return;
    }

    this.commands.forEach((command) => {
      const messageIsCallingCommand = [
        command.name,
        ...(command.aliases ?? []),
      ].includes(parsedCommandMessage.result.name);

      if (!messageIsCallingCommand) {
        return;
      }

      const executeArgs = buildExecuteArgs(
        parsedCommandMessage.result.args,
        command.args
      );

      if (!executeArgs.success) {
        if (executeArgs.error instanceof MissingRequiredArgumentError) {
          replyWithError(message, executeArgs.error);
        }
        return;
      }

      command.execute({ args: executeArgs.result, message });
    });
  }
}
