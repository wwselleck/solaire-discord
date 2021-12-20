import Discord from 'discord.js';
import { Command, CommandArg } from './command';

export class CommandProcessingError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'CommandProcessingError';
    Object.setPrototypeOf(this, CommandProcessingError.prototype);
  }
}

interface UnhandledCommandExecutionErrorArgs {
  command: Command;
  invokingMessage: Discord.Message;
  unhandledError: Error;
}
export class UnhandledCommandExecutionError extends Error {
  public command: Command;
  public unhandledError: Error;
  public invokingMessage: Discord.Message;

  constructor({
    command,
    unhandledError,
    invokingMessage
  }: UnhandledCommandExecutionErrorArgs) {
    super(
      `Unhandled error during command execution: ${unhandledError.message}`
    );
    this.name = 'UnhandledCommandExecutionError';
    this.command = command;
    this.unhandledError = unhandledError;
    this.invokingMessage = invokingMessage;

    Object.setPrototypeOf(this, UnhandledCommandExecutionError.prototype);
  }
}

interface MissingRequiredArgErrorArgs {
  command: Command;
  commandArg: CommandArg;
  invokingMessage: Discord.Message;
}
export class MissingRequiredArgError extends CommandProcessingError {
  public command: Command;
  public commandArg: CommandArg;
  public invokingMessage: Discord.Message;

  constructor(opts: MissingRequiredArgErrorArgs) {
    super(
      `Missing required argument '${opts.commandArg.name}' for command ${opts.command.name}`
    );
    this.command = opts.command;
    this.commandArg = opts.commandArg;
    this.invokingMessage = opts.invokingMessage;

    Object.setPrototypeOf(this, MissingRequiredArgError.prototype);
  }
}

interface InvalidArgValueErrorArgs {
  command: Command;
  commandArg: CommandArg;
  providedValue: string;
  invokingMessage: Discord.Message;
}
export class InvalidArgValueError extends CommandProcessingError {
  public command: Command;
  public commandArg: CommandArg;
  public providedValue: string;
  public invokingMessage: Discord.Message;

  constructor(opts: InvalidArgValueErrorArgs) {
    super(
      `Invalid value ${opts.providedValue} provided for arg ${opts.commandArg.name} of type ${opts.commandArg.type} for command ${opts.command.name}`
    );
    this.command = opts.command;
    this.commandArg = opts.commandArg;
    this.providedValue = opts.providedValue;
    this.invokingMessage = opts.invokingMessage;
    Object.setPrototypeOf(this, InvalidArgValueError.prototype);
  }
}

export type SolaireError =
  | CommandProcessingError
  | UnhandledCommandExecutionError;
