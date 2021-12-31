const Discord = require('discord.js');
const { Solaire } = require('solaire-discord');

class Farm {
  animals = [];
  petHistory = [];

  addAnimal(kind, name) {
    let newAnimalName = name;
    if (!newAnimalName) {
      const currentOfKind = this.animals.find(
        (otherAnimal) => otherAnimal.kind === kind
      );
      newAnimalName = `${kind} ${currentOfKind + 1}`;
    }
    this.animals.push({ kind, name: newAnimalName });
  }

  all() {
    return this.animals;
  }

  pet(idUser, name) {
    const animalWithNameExists = Boolean(
      this.animals.find((animal) => animal.name === name)
    );

    if (!animalWithNameExists) {
      throw new Error(`Cannot pet animal ${name}, they're not in the farm`);
    }

    this.petHistory.push({ date: new Date(), idUser, name });
  }

  getPetHistory() {
    return this.petHistory;
  }
}

const farm = new Farm();

/**
 * Example usage:
 *
 * > !add Cow Alfred
 * > !farm
 * Alfred the Cow
 *
 */
const bot = Solaire.create({
  discordClient: new Discord.Client({
    intents: [
      Discord.Intents.FLAGS.GUILDS,
      Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
  }),
  token: process.env.TOKEN || '',
  commandPrelude: '!',
  commandCooldown: 2000,
  commands: {
    'add-animal|add <animalKind> [animalName]': {
      execute({ args }) {
        const { animalKind, animalName } = args;
        farm.addAnimal(animalKind, animalName);
      }
    },
    farm: {
      execute({ message }) {
        const animals = farm.all();
        let response = '';

        if (animals.length > 0) {
          animals.forEach((animal) => {
            response += `${animal.name} the ${animal.kind}\n`;
          });
        } else {
          response = 'There are no animals in the farm :(';
        }

        message.channel.send(response);
      }
    },
    'pet <name> [times:Int]': {
      execute({ message, args }) {
        const { name, times = 1 } = args;
        for (let i = 0; i < times; i++) {
          try {
            farm.pet(message.author.id, name);
          } catch (e) {
            message.channel.send(e.message);
          }
        }
      }
    },
    'petHistory|pets [user:GuildMember]': {
      async execute({ message, args }) {
        const petHistory = farm.getPetHistory().reverse();

        const { user } = args;

        let petsToOutput = user
          ? petHistory.filter((pet) => pet.idUser === user.user.id).slice(0, 10)
          : petHistory.slice(0, 10);

        let result = '';
        for (const pet of petsToOutput) {
          const userWhoPet = await message.guild.members.fetch(pet.idUser);
          result += `${pet.date.toString()} ${userWhoPet.displayName} pet ${
            pet.name
          }\n`;
        }
        return message.channel.send(result);
      }
    },
    'closeFarm|close': {
      async execute({ message }) {
        message.channel.send('The farm is now closed!');
      },
      async guard({ message, error, ok }) {
        if (
          !message.member.roles.cache.some(
            (r) => r.name.toLowerCase() === 'farmer'
          )
        ) {
          error('');
        }
        ok();
      }
    }
  }
});

farm.addAnimal('cow', 'benny');

bot.on('commandInvokedEnd', (evt) => {
  console.log(evt);
});

bot.start();
