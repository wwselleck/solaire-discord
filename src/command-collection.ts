import { Command } from './command';
import { validateCommand } from './command-validate';

export class CommandCollection {
  constructor(private commands: Command[]) {
    commands.forEach((command) => validateCommand(command));
  }

  addCommand(command: Command) {
    this.commands.push(command);
  }

  getCommand(keyword: string) {
    for (const command of this.commands) {
      const keywordMatchesCommand = [
        command.name,
        ...(command.aliases ?? [])
      ].includes(keyword);
      if (keywordMatchesCommand) {
        return command;
      }
    }
    return null;
  }
}
