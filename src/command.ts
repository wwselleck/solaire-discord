export interface Command {
  name: string;
  aliases?: string[];
  execute(): void;
}
