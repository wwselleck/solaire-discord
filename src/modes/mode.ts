import Discord from 'discord.js';
import { EventEmitter } from 'events';
import { Command } from '../command';
import { CommandInvocationError } from '../command-invocation-error';

export interface SolaireMode extends EventEmitter {
  start(): Promise<void>;
}

interface BaseMessageHandleResult {
  message: Discord.Message;
}

interface NoCommandInvoked extends BaseMessageHandleResult {
  success: true;
  commandInvoked: false;
  preludeIncluded: boolean;
}

interface CommandInvokedSuccess extends BaseMessageHandleResult {
  success: true;
  commandInvoked: true;
  command: Command;
}

interface CommandInvokedFailure extends BaseMessageHandleResult {
  success: false;
  commandInvoked: true;
  command: Command;
  error: CommandInvocationError;
}

export type MessageHandleResult =
  | NoCommandInvoked
  | CommandInvokedSuccess
  | CommandInvokedFailure;
