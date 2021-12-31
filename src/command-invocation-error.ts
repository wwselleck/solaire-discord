import { Command, CommandArg } from './command';

export const CooldownInEffect = () => {
  return {
    type: 'cooldown-in-effect'
  } as const;
};

export const BlockedByGuard = (error: any) => {
  return {
    type: 'blocked-by-guard',
    error
  } as const;
};

export const MissingRequiredArg = (commandArg: CommandArg) => {
  return {
    type: 'missing-required-arg',
    commandArg
  } as const;
};

export const InvalidArgValue = (
  commandArg: CommandArg,
  providedValue: string
) => {
  return {
    type: 'invalid-arg-value',
    commandArg,
    providedValue
  } as const;
};

export const UnhandledCommandExecutionError = (error: Error) => {
  return {
    type: 'unhandled-command-execution-error',
    error
  } as const;
};

export type CommandInvocationError =
  | ReturnType<typeof CooldownInEffect>
  | ReturnType<typeof InvalidArgValue>
  | ReturnType<typeof MissingRequiredArg>
  | ReturnType<typeof BlockedByGuard>
  | ReturnType<typeof UnhandledCommandExecutionError>;
