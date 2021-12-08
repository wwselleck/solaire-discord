import Discord from 'discord.js';
import { Command } from './command';
import { CommandProcessingError } from './error';
import { getIdFromMention } from './discord-message-utils';

export class MissingRequiredArgumentError extends CommandProcessingError {
  constructor(public argName: string) {
    super(`Missing required argument '${argName}'`);
    Object.setPrototypeOf(this, MissingRequiredArgumentError.prototype);
  }
}

export class InvalidArgValue extends CommandProcessingError {
  constructor(
    public argName: string,
    public argStr: string,
    public argType?: string
  ) {
    super(
      `Invalid value ${argStr} provided for arg ${argName} of type ${argType}`
    );
    Object.setPrototypeOf(this, InvalidArgValue.prototype);
  }
}

function escapeRegex(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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
const extractCommandTokens = (prelude = '', message: string) => {
  if (!message.startsWith(prelude)) {
    return [];
  }

  // Remove the prelude
  const re = new RegExp(`^(${escapeRegex(prelude)})`);
  const messageWithoutPrelude = message.replace(re, '');

  return messageWithoutPrelude.match(/\S+/g) ?? [];
};

export const resolveArgValueOfType = (
  message: Discord.Message,
  argStr: string,
  argType?: string
) => {
  if (!argType) {
    return argStr;
  }
  if (argType === 'Int') {
    const res = parseInt(argStr);
    if (Number.isNaN(res)) {
      throw new Error('Could not parse int');
    }
    return res;
  }
  if (argType === 'Float') {
    const res = parseFloat(argStr);
    if (Number.isNaN(res)) {
      throw new Error('Could not parse float');
    }
    return res;
  }
  if (argType === 'GuildMember') {
    const idMember = getIdFromMention(argStr);
    if (!idMember) {
      throw new Error('Could not parse guild member arg');
    }
    return message.guild!.members.cache.get(idMember);
  }
  if (argType === 'Date') {
    const resolvedDate = new Date(argStr);
    return resolvedDate;
  }
  throw new Error(`Invalid arg type ${argType}`);
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
      success: false
    };
  }

  const [nameToken, ...argsTokens] = tokens;

  return {
    success: true,
    result: {
      name: nameToken,
      args: argsTokens
    }
  };
};

export const buildExecuteArgs = (
  message: Discord.Message,
  messageArgs: ParsedCommandMessage['args'],
  commandArgs?: Command['args']
):
  | { success: false; error: Error }
  | { success: true; result: Record<string, any> } => {
  if (!commandArgs) {
    return { success: true, result: {} };
  }
  const args = {} as Record<string, any>;

  let commandArgIndex = 0;
  let messageArgIndex = 0;
  while (
    commandArgIndex < commandArgs.length &&
    messageArgIndex < messageArgs.length
  ) {
    const messageArg = messageArgs[messageArgIndex];
    const commandArg = commandArgs[commandArgIndex];

    if (commandArg.rest) {
      args[commandArg.name] = messageArgs.slice(messageArgIndex).join(' ');
      messageArgIndex = messageArgs.length;
      commandArgIndex++;
    } else {
      try {
        args[commandArg.name] = resolveArgValueOfType(
          message,
          messageArg,
          commandArg.type
        );
      } catch (e) {
        return {
          success: false,
          error: new InvalidArgValue(
            commandArg.name,
            messageArg,
            commandArg.type
          )
        };
      }
      messageArgIndex++;
      commandArgIndex++;
    }
  }
  while (commandArgIndex < commandArgs.length) {
    const commandArg = commandArgs[commandArgIndex];
    if (commandArg.required) {
      return {
        success: false,
        error: new MissingRequiredArgumentError(commandArg.name)
      };
    }
    commandArgIndex++;
  }

  return {
    success: true,
    result: args
  };
};
