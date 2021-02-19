import Discord from "discord.js";
import { Command } from "./command";

function escapeRegex(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Take a content string and return the command tokens
 *
 * Example:
 *
 * Prelude: !
 * Message: !trivia c
 * Return: [trivia, c]
 *
 * Prelude:
 * Message: !trivia c
 * Return: [!trivia, c]
 *
 */
const extractCommandTokens = (prelude: string = "", message: string) => {
  if (!message.startsWith(prelude)) {
    return [];
  }

  // Remove the prelude
  let re = new RegExp(`^(${escapeRegex(prelude)})`);
  let messageWithoutPrelude = message.replace(re, "");

  return messageWithoutPrelude.match(/\S+/g) ?? [];
};

interface ParsedCommandMessage {
  name: string;
  args: string[];
}

export const parseCommandMessage = (
  message: string,
  prelude?: string
): { success: false } | { success: true; result: ParsedCommandMessage } => {
  const tokens = extractCommandTokens(prelude, message);
  if (tokens.length === 0) {
    return {
      success: false,
    };
  }

  const [nameToken, ...argsTokens] = tokens;

  return {
    success: true,
    result: {
      name: nameToken,
      args: argsTokens,
    },
  };
};

export class MissingRequiredArgumentError extends Error {
  constructor(public argName: string) {
    super(`Missing required argument ${argName}`);
    Object.setPrototypeOf(this, MissingRequiredArgumentError.prototype);
  }
}

export const buildExecuteArgs = (
  messageArgs: ParsedCommandMessage["args"],
  commandArgs?: Command["args"]
):
  | { success: false; error: Error }
  | { success: true; result: Record<string, any> } => {
  if (!commandArgs) {
    return { success: true, result: {} };
  }
  const args = {} as Record<string, any>;

  let argIndex = 0;
  while (argIndex < messageArgs.length) {
    const messageArg = messageArgs[argIndex];
    const commandArg = commandArgs[argIndex];
    args[commandArg.name] = messageArg;
    argIndex++;
  }
  while (argIndex < commandArgs.length) {
    const commandArg = commandArgs[argIndex];
    if (commandArg.required) {
      return {
        success: false,
        error: new MissingRequiredArgumentError(commandArg.name),
      };
    }
    argIndex++;
  }

  return {
    success: true,
    result: args,
  };
};
