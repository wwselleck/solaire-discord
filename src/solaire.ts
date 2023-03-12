import Discord from 'discord.js';
import EventEmitter from 'events';
import { Mode, Command, CommandArg, parseCommandString } from './command';
import {
  ExecutableCommandCollection,
  ExecuteFn,
  GuardFn
} from './executable-command-collectoin';
import { PreludeCommandRunner } from './command-runner';
import { SolaireMode } from './modes/mode';
import { PreludeMode, SolairePreludeConfig } from './modes/prelude';

type SolaireCommands<M extends Mode> = Record<
  string,
  {
    execute: ExecuteFn<M>;
    guard: GuardFn<M>;
  }
>;

interface SolaireSlashConfig {
  mode: 'slash';
}

type SolaireConfig = SolairePreludeConfig;

export class Solaire extends EventEmitter {
  private mode: SolaireMode | null;

  constructor(private config: SolaireConfig) {
    super();
    const mode = config.mode ?? 'prelude';
    this.mode = mode === 'prelude' ? new PreludeMode(config) : null;
  }

  static create(config: SolaireConfig) {
    return new Solaire(config);
  }

  start() {
    this.config.discordClient.login(this.config.token);
    this.mode?.start();
  }
}
