import Discord from 'discord.js';
import EventEmitter from 'events';
import { Mode, Command, CommandArg, parseCommandString } from './command';
import {
  ExecutableCommandCollection,
  ExecuteFn,
  GuardFn
} from './executable-command-collection';
import { SolaireMode } from './modes/mode';
import { prefixMode, SolairePreludeConfig } from './modes/prelude';

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

export class PrefixCommands extends EventEmitter {
  private mode: SolaireMode | null;

  constructor(private config: SolaireConfig) {
    super();
    const mode = config.mode ?? 'prefix';
    this.mode = mode === 'prefix' ? new PreludeMode(config) : null;
  }

  static create(config: SolaireConfig) {
    return new Solaire(config);
  }

  start() {
    this.config.discordClient.login(this.config.token);
    this.mode?.start();
  }
}
