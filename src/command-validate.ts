import { Command } from "./command";

export class ArgPositionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ArgPositionError";
    Object.setPrototypeOf(this, ArgPositionError.prototype);
  }
}

export class DuplicateArgError extends Error {
  constructor(argName: string) {
    super(`Duplicate arg name ${argName}`);
    this.name = "DuplicateArgError";
    Object.setPrototypeOf(this, DuplicateArgError.prototype);
  }
}

export function validateCommand(command: Command) {
  const argError = validateCommandArgs(command.args);
  if (argError) {
    throw argError;
  }
}

function validateCommandArgs(commandArgs: Command["args"]) {
  if (!commandArgs) {
    return null;
  }

  let optionalArgFound = false;
  let restArgFound = false;
  let commandArgNames = new Set();

  for (const commandArg of commandArgs) {
    if (restArgFound) {
      return new ArgPositionError(
        `Invalid arg ${commandArg.name} positioned after rest arg`
      );
    }

    if (optionalArgFound && commandArg.required) {
      return new ArgPositionError(
        `Invalid required arg ${commandArg.name} positioned after optional arg`
      );
    }

    if (commandArg.rest) {
      restArgFound = true;
    }
    if (!commandArg.required) {
      optionalArgFound = true;
    }
    if (commandArgNames.has(commandArg.name)) {
      throw new DuplicateArgError(commandArg.name);
    }
    commandArgNames.add(commandArg.name);
  }
  return null;
}
