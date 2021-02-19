# Solaire
A lightweight framework for creating discord bots using Node.

```js
import { Solaire } from "solaire-discord";

const bot = Solaire.create({
  token: process.env.TOKEN,
  commandPrelude: "!",
  commands: {
    "echo <msg>": {
      execute({ args, message }) {
        message.channel.send(`You said ${args.msg}!`;
      },
    },
  },
});

bot.start();

```

## Install
`npm install solaire-discord`

## Usage
### Discord.js
Solaire interacts heavily with [Discord.js](https://github.com/discordjs/discord.js), and many of the objects exposed from the Solaire API will be directly from Discord.js.


