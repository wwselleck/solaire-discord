# Solaire
A lightweight framework with a simple and intuitive interface for creating Discord bots using Node.

```js
import { Solaire } from "solaire-discord";

const bot = Solaire.create({
  token: process.env.TOKEN,
  commandPrelude: "!",
  commands: {
    // In a Discord channel...
    // > !ban @someUser being mean
    "ban <user:GuildMember> <...offense>": {
      execute({ args, message }) {
        // args.user: Discord.js::GuildMember(someUser)
        // args.offense: ["being", "mean"]
        message.channel.send(`Banning ${args.user.displayName} for ${args.offense.join(' ')}!`;
      },
    },
  },
});

bot.start();

```

### Discord.js
Solaire interacts heavily with [Discord.js](https://github.com/discordjs/discord.js), and many of the objects exposed from the Solaire API will be directly from Discord.js.

---

**[Example Bot](./example-bot)**

[Install](#install) ·
[Example Config](#example-config) ·
[Commands](#commands)

---

## Install
`npm install solaire-discord`

## Example Config
```js
  const bot = Solaire.create({
      token: 'abc-def';
      commandPrelude: '!';
      commandCooldown: 5000;
      commands: ...
  })
```


## Commands
Commands are probably what you think of first when thinking about chat bots. They let you type something like in a text room and have a bot user perform that action for you.

Solaire lets you define your bot's commands by writing out a definition string that maps very closely to how you'd actually use the command in your Discord server.

To demonstrate how to define commands in Solaire, we'll build a command for banning users from your server, starting with the simplest possible definition, and working up to a more complex definition using the ease-of-use options that Solaire provides.


```js
   const bot = Solaire.create({
    ...
    commands: {
      'ban <user> <reason>': {
        execute({ args, message }) {
          ...
        }
      }
    }
  })
```

> ban @someAnnoyingUser mean

This configuration defines one command for your bot, `ban`, that accepts two arguments, `user` and `reason`. There's a bit more we can add to this that we'll get to in a second, but the great thing about this form of defining commands is that its self-documenting; the interface of this command is clearly defined in one place, as opposed to say having to read through a JS object that defines a command and patching together in your head what the syntax for that command is.

### Command Prelude
It is heavily suggested that you assign a `commandPrelude` to your bot, which is the string that is required at the start of any command invocation. Otherwise, Solaire has to process every single message for the possibility that it's invoking a command. It's also just nan extremely common practice for chat bots.

```js
   const bot = Solaire.create({
    ...
    // To invoke a command in chat, the message has to start with '!'
    // e.g. ❌  ban @someUser being mean WON'T work
    //      ✅ !ban @someUser being mean WILL work
    commandPrelude: '!',
    commands: {
      'ban <user> <reason>': {
        ...
      }
    }
   })
```

```
> !ban @someAnnoyingUser mean
```

### Command Execute Function
When your command is invoked, the command's `execute` function gets called, passing in the arguments used and the Discord.js::Message object that invoked the command.

```js
   const bot = Solaire.create({
    ...
    commandPrelude: '!',
    commands: {
      'ban <user> <reason>': {
        async execute({ args, message }) {
         // message: Discord.js::Message
         // args.user: string
         // args.numPoints: string

         const user = await message.guild.members.fetch(args.user);

         message.channel.send(`Banning ${user.displayName} for ${args.reason}`;

         user.ban({ reason: args.reason })
        }
      }
    }
  })
```

```
> !ban @someAnnoyingUser mean
< Banning Some Annoying User for mean
```

### Commmand Aliases
For whatever reason, our server is prone to attracting many mean users, and we're spending a ton of time typing `!ban` each time we need to get rid of someone. To fix this, we can define an alias for our command, say just `b`, by simpling adding `|` plus the name of our alias after the name of the command.

```js
   const bot = Solaire.create({
    ...
    commandPrelude: '!',
    commands: {
      'ban|b <user> <reason>': {
        ...
      }
    }
  })
```

```
> !b @someAnnoyingUser mean
< Banning Some Annoying User for mean
```

You can add as many aliases as you want.

```js
   const bot = Solaire.create({
    ...
    commandPrelude: '!',
    commands: {
      'ban|b|banUser|goAway <user> <reason>': {
        ...
      }
    }
  })
```

### Command Arguments
#### Optional Arguments
We also happen to be tired of having to type in a reason every time we ban someone, but if we were to leave a reason out of the ban message, we'd get this

```
> !ban @someAnnoyingUser
< Missing required argument 'reason'
```

This is because we defined our command's arguments by wrapping them in `<>`, which denotes that they are **required** arguments. If we instead wrapped our `reason` argument in `[]`, it would be **optional**.

```js
   const bot = Solaire.create({
    ...
    commandPrelude: '!',
    commands: {
      'ban|b <user> [reason]': {
         const user = await message.guild.members.fetch(args.user);

         message.channel.send(`Banning ${user.displayName} ${args.reason
           ? `for ${args.reason}`
           : ''
         }`);

         user.ban({ reason: args.reason })
      }
    }
  })
```

```
> !b @someAnnoyingUser
< Banning Some Annoying User
```

#### Rest Arguments
You may be wondering why the example `reason`` I've been using thus far has just been the word "mean". Surely "being mean" or "spamming some meme stock" would be a better, more descriptive reason. But if we were to try that now...


