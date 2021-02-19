import Discord from "discord.js";

export interface CommandArg {
  name: string;
  required: boolean;
}

export type CommandExecuteArgs = Record<string, string>;

export interface CommandExecutePayload {
  message: Discord.Message;
  args?: CommandExecuteArgs;
}

export interface Command {
  name: string;
  aliases?: string[];
  args?: CommandArg[];
  execute(payload: CommandExecutePayload): void;
}

export function parseCommandString(cmdString: string) {
  const [nameToken, ...argTokens] = cmdString.split(" ");
  if (!nameToken) {
    throw new Error("Invalid command string: Missing name");
  }
  const { name, aliases } = parseCommandStringName(nameToken);
  const args = argTokens.map((token) => parseArgToken(token));
  return {
    name,
    aliases,
    args,
  };
}

function parseCommandStringName(cmdStringName: string) {
  const [name, ...aliases] = cmdStringName.split("|");
  return { name, aliases };
}

function parseArgToken(argToken: string): CommandArg {
  const name = argToken.slice(1, -1);
  const required = argToken[0] === "<";
  return {
    name,
    required,
  };
}
