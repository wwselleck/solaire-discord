# Solaire
A lightweight framework for creating Discord bots using Node.

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

### Discord.js
Solaire interacts heavily with [Discord.js](https://github.com/discordjs/discord.js), and many of the objects exposed from the Solaire API will be directly from Discord.js.


## Install
`npm install solaire-discord`

## Usage
```js
  const bot = Solaire.create({
    // Discord bot user token
    token: 'abc-def'
  })
  bot.start()
```

### Commands
Commands are probably what you think of first when thinking about chat bots. They let you type something like in a text room and have a bot user perform that action for you.
> !ban @someAnnoyingUser


Soliare uses a manpage-esque style of defining commands. 

```js
   const bot = Solaire.create({
    ...
    commands: {
      'play|p <youtubeUrl> [times]': {
        execute({ args, message }) {
          ...
        }
      }
    }
  })
```
`play|p` defines the name of the command, and an alias. `play` is the primary name of the command, and `p` is an alias that you can also use to invoke the command.

`<youtubeUrl>` defines a _required_ argument with name `youtubeUrl`. The surrounding `<>` is what defines the argument as required, as opposed to the next argument in our command.

`[times]` defines an _optional_ argument with name `times`. The surround `[]`, as opposed to `<>` defines the argument as optional.

When your command is invoked in chat, the passed in `execute` function will be called with your defined `args` and the `Discord.js::Message` object that invoked the command.

> play https://www.youtube.com/watch?v=EsfjKkdw1Cs 3
```
 execute({ args, message }) {
   // args: {
   //  youtubeUrl: 'https://www.youtube.com/watch?v=EsfjKkdw1Cs',
   //  times: '3'
   // }
  }
```


