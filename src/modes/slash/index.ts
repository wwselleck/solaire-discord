import * as Discord from 'discord.js';
import EventEmitter from 'events';
import { parseCommandString } from '../../command';
import { logger } from '../../logger';

interface SlashCommandExecutePayload {
  interaction: Discord.ChatInputCommandInteraction;
}

interface ExecutableSlashCommand {
  name: string;
  description: string;
  execute(payload: SlashCommandExecutePayload): Promise<void> | void;
}

function buildSlashCommand(command: ExecutableSlashCommand) {
  return new Discord.SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description);
}

interface SlashCommandConfig {
  description: string;
  execute: ExecutableSlashCommand['execute'];
}

export interface SlashCommandsConfig {
  discordClient: Discord.Client;
  discordClientId: string;
  token: string;
  commands: Record<string, SlashCommandConfig>;
}

export class SlashCommands extends EventEmitter {
  config: SlashCommandsConfig;
  private executableCommands: Map<string, ExecutableSlashCommand>;

  constructor(config: SlashCommandsConfig) {
    super();
    this.config = config;
    this.executableCommands = new Map();
    for (const [cmdString, cmdConfig] of Object.entries(config.commands)) {
      const parsedCommandString = parseCommandString(cmdString);
      if ((parsedCommandString.aliases?.length ?? 0) > 0) {
        console.warn('Slash mode does not support command aliases');
      }
      this.executableCommands.set(parsedCommandString.name, {
        name: parsedCommandString.name,
        description: cmdConfig.description,
        execute: cmdConfig.execute
      });
    }
  }

  async start() {
    this.config.discordClient.login(this.config.token);
    await this.refreshCommands();
    await this.listen();
  }

  async refreshCommands() {
    const rest = new Discord.REST({ version: '10' }).setToken(
      this.config.token
    );

    const slashCommands = [];
    for (const executableCommand of Array.from(
      this.executableCommands.values()
    )) {
      console.log('Building slash command for command', executableCommand);
      const slashCommand = buildSlashCommand(executableCommand);
      slashCommands.push(slashCommand.toJSON());
    }

    logger.info(`Registering ${slashCommands.length} commands`);
    await rest.put(
      Discord.Routes.applicationCommands(this.config.discordClientId),
      {
        body: slashCommands
      }
    );
  }

  async listen() {
    this.config.discordClient.on(
      Discord.Events.InteractionCreate,
      (interaction) => {
        if (!interaction.isChatInputCommand()) {
          return;
        }

        const executableCommand = this.executableCommands.get(
          interaction.commandName
        );

        if (!executableCommand) {
          logger.error(
            `Attempt to run invalid command: ${interaction.commandName}`
          );
          return;
        }

        const payload = {
          interaction
        };

        executableCommand.execute(payload);
      }
    );
  }
}
