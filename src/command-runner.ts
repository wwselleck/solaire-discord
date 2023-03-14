import Discord from 'discord.js';
import { Command } from './command';
import { CommandInvocationError } from './command-invocation-error';

interface BaseMessageHandleResult {
  message: Discord.Message;
}

interface NoCommandInvoked extends BaseMessageHandleResult {
  success: true;
  commandInvoked: false;
  prefixIncluded: boolean;
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

type MessageHandleResult =
  | NoCommandInvoked
  | CommandInvokedSuccess
  | CommandInvokedFailure;
