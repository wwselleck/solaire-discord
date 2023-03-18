import Discord from 'discord.js';

export type Mode = 'slash' | 'prefix';

export interface CommandArg {
  name: string;
  required?: boolean;
  rest?: boolean;
  type?: string;
}

export interface ParsedCommandString {
  name: string;
  aliases?: string[];
  args?: CommandArg[];
}

export function parseCommandString(cmdString: string): ParsedCommandString {
  const [nameToken, ...argTokens] = cmdString.split(' ');
  if (!nameToken) {
    throw new Error('Invalid command string: Missing name');
  }
  const { name, aliases } = parseCommandStringName(nameToken);
  const args = argTokens.map((token) => parseArgTokenToCommandArg(token));

  return {
    name,
    aliases,
    args
  };
}

function parseCommandStringName(cmdStringName: string) {
  const [name, ...aliases] = cmdStringName.split('|');
  return { name, aliases };
}

interface ParsedArgToken {
  name: string;
  surroundingChars: [string, string];
  type?: string;
  rest?: boolean;
}

function parseArgToken(argToken: string): ParsedArgToken {
  const innerText = argToken.slice(1, -1);

  const { name, rest, type } = parseArgTokenInnerText(innerText);
  const surroundingChars: [string, string] = [
    argToken[0],
    argToken[argToken.length - 1]
  ];

  return {
    name,
    rest,
    surroundingChars,
    type
  };
}

interface ParsedArgTokenInnerText {
  name: string;
  rest?: boolean;
  type?: string;
}

function parseArgTokenInnerText(innerText: string): ParsedArgTokenInnerText {
  if (innerText.startsWith('...')) {
    const name = innerText.slice(3);
    if (name.includes(':')) {
      throw new Error(`Rest arg (${name}) can not specify type`);
    }
    return {
      name: innerText.slice(3),
      rest: true
    };
  }

  const [name, type] = innerText.split(':');

  return {
    name,
    type: type
  };
}

function parseArgTokenToCommandArg(argToken: string): CommandArg {
  const {
    name,
    rest,
    surroundingChars,
    type: argType
  } = parseArgToken(argToken);

  const isRequired = ([startChar, endChar]: [string, string]) => {
    if (startChar === '<' && endChar === '>') {
      return true;
    } else if (startChar === '[' && endChar === ']') {
      return false;
    }
    throw new Error(
      `Argument ${name} has invalid surrounding characters ${surroundingChars}`
    );
  };

  return {
    name,
    ...(rest && { rest }),
    ...(argType && { type: argType }),
    required: isRequired(surroundingChars)
  };
}
