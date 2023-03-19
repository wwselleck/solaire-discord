import * as Discord from 'discord.js';
import EventEmitter from 'events';
import { parseCommandString } from '../../command';
import { logger } from '../../logger';

interface SolaireSlashCommandExecutePayload {
  interaction: Discord.ChatInputCommandInteraction;
}

interface SolaireSlashCommand {
  name: string;
  description: string;
  execute(payload: SolaireSlashCommandExecutePayload): Promise<void> | void;
}

function buildDiscordSlashCommand(command: SolaireSlashCommand) {
  return new Discord.SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description);
}

interface SlashCommandConfig {
  description: string;
  execute: SolaireSlashCommand['execute'];
}

export interface SlashCommandsConfig {
  discordClient: Discord.Client;
  discordClientId: string;
  token: string;
  commands: Record<string, SlashCommandConfig>;
}

export class SlashCommands extends EventEmitter {
  config: SlashCommandsConfig;
  private configuredCommands: Map<string, SolaireSlashCommand>;

  constructor(config: SlashCommandsConfig) {
    super();
    this.config = config;
    this.configuredCommands = new Map();
    for (const [cmdString, cmdConfig] of Object.entries(config.commands)) {
      const parsedCommandString = parseCommandString(cmdString);
      if ((parsedCommandString.aliases?.length ?? 0) > 0) {
        console.warn('Slash mode does not support command aliases');
      }
      this.configuredCommands.set(parsedCommandString.name, {
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

    const existingCommands = (await rest.get(
      Discord.Routes.applicationCommands(this.config.discordClientId)
    )) as any;

    logger.info(`Configured Commands =>
${Array.from(this.configuredCommands.values()).map(
  (command: any) => `${command.name}\n`
)}`);

    logger.info(`Existing Commands on Start =>
${existingCommands.map((command: any) => `${command.name}\n`)}`);

    for (const existingCommand of existingCommands) {
      if (!this.configuredCommands.has(existingCommand.name)) {
        logger.warn(
          `Command "${existingCommand.name}" is currently registered, but is not included in your configuration. This command will be removed.`
        );
      }
    }

    const slashCommands = [];
    for (const configuredCommand of Array.from(
      this.configuredCommands.values()
    )) {
      const slashCommand = buildDiscordSlashCommand(configuredCommand);
      slashCommands.push(slashCommand.toJSON());
    }

    await rest.put(
      Discord.Routes.applicationCommands(this.config.discordClientId),
      {
        body: slashCommands
      }
    );
    logger.info(`Registered ${slashCommands.length} commands`);
  }

  async listen() {
    this.config.discordClient.on(
      Discord.Events.InteractionCreate,
      (interaction) => {
        if (!interaction.isChatInputCommand()) {
          return;
        }

        const executableCommand = this.configuredCommands.get(
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
