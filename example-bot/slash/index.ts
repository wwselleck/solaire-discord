import * as Discord from 'discord.js';
import { SlashCommands } from '../../src';
// @ts-ignore
import { Farm } from '../farm';

const farm = new Farm();

/**
 * Example usage:
 *
 * > !add Cow Alfred
 * > !farm
 * Alfred the Cow
 *
 */
const commands = new SlashCommands({
  discordClient: new Discord.Client({
    intents: [Discord.GatewayIntentBits.Guilds]
  }),
  discordClientId: '912449107145162752',
  token: process.env.TOKEN || '',
  //cooldown: 2000,
  commands: {
    farm: {
      description: 'Get all farm animals',
      execute({ interaction }) {
        const animals = farm.all();
        let response = '';

        if (animals.length > 0) {
          animals.forEach((animal: any) => {
            response += `${animal.name} the ${animal.kind}\n`;
          });
        } else {
          response = 'There are no animals in the farm :(';
        }

        interaction.reply(response);
      }
    }
  }
});

farm.addAnimal('cow', 'benny');

commands.on('commandInvokedEnd', (evt) => {
  console.log(evt);
});

commands.start();
