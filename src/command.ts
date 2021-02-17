export interface Command {
  name: string;
  aliases?: string[];
  execute(): void;
}

export function parseCommandString(cmdString: string) {
  const [nameToken, ...restTokens] = cmdString.split(" ");
  if (!nameToken) {
    throw new Error("Invalid command string: Missing name");
  }
  const { name, aliases } = parseCommandStringName(nameToken);
  return {
    name,
    aliases,
  };
}

function parseCommandStringName(cmdStringName: string) {
  const [name, ...aliases] = cmdStringName.split("|");
  return { name, aliases };
}
