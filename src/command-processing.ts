import Discord from 'discord.js';
import { Command } from './command';
import {
  InvalidArgValue,
  MissingRequiredArg
} from './command-invocation-error';
import { getIdFromMention } from './discord-message-utils';

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
const extractCommandTokens = (prefix = '', message: string) => {
  if (!message.startsWith(prefix)) {
    return [];
  }

  // Remove the prefix
  const re = new RegExp(`^(${escapeRegex(prefix)})`);
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
  prefix?: string
): { success: false } | { success: true; result: ParsedCommandMessage } => {
  const tokens = extractCommandTokens(prefix, message);
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
  command: Command
): Record<string, any> => {
  if (!command.args) {
    return {};
  }
  const args = {} as Record<string, any>;

  let commandArgIndex = 0;
  let messageArgIndex = 0;
  while (
    commandArgIndex < command.args.length &&
    messageArgIndex < messageArgs.length
  ) {
    const messageArg = messageArgs[messageArgIndex];
    const commandArg = command.args[commandArgIndex];

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
        throw InvalidArgValue(commandArg, messageArg);
      }
      messageArgIndex++;
      commandArgIndex++;
    }
  }
  while (commandArgIndex < command.args.length) {
    const commandArg = command.args[commandArgIndex];
    if (commandArg.required) {
      throw MissingRequiredArg(commandArg);
    }
    commandArgIndex++;
  }

  return args;
};
