import Discord from 'discord.js';
import { Command, Mode } from './command';
import { validateCommand } from './command-validate';

export type CommandExecuteArgs = Record<string, any>;

export interface CommandExecutePayload<M extends Mode> {
  message: Discord.Message;
  args: CommandExecuteArgs;
  interaction: M extends 'slash' ? Discord.Interaction : undefined;
}

export interface GuardPayload<M extends Mode> extends CommandExecutePayload<M> {
  ok(): void;
  error(err?: any): void;
}

export type ExecuteFn<M extends Mode> = (
  payload: CommandExecutePayload<M>
) => Promise<void> | void;

export type GuardFn<M extends Mode> = (
  payload: GuardPayload<M>
) => Promise<void> | void;

interface ExecutableCommand<M extends Mode> {
  command: Command;
  execute: ExecuteFn<M>;
  guard?: GuardFn<M>;
}

export class ExecutableCommandCollection<M extends Mode> {
  private executableCommands: ExecutableCommand<M>[];

  constructor() {
    this.executableCommands = [];
  }

  add(command: ExecutableCommand<M>) {
    this.executableCommands.push(command);
  }

  get(keyword: string) {
    console.log(this.executableCommands);
    for (const executableCommand of this.executableCommands) {
      const { command } = executableCommand;

      const keywordMatchesCommand = [
        command.name,
        ...(command.aliases ?? [])
      ].includes(keyword);
      if (keywordMatchesCommand) {
        return executableCommand;
      }
    }
    return null;
  }
}
