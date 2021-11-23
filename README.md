<img width="1000px" src="./assets/solaire-banner.png" />

# Solaire

A simple framework with an intuitive interface for creating Discord bots using Node.

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

```
> ban @someAnnoyingUser mean
```

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
         // args.reason: string

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

### Command Aliases
For whatever reason, our server is prone to attracting many mean users, and we're spending a ton of time typing `!ban` each time we need to get rid of someone. To fix this, we can define an alias for our command, say just `b`, by simply adding `|` plus the name of our alias after the name of the command.

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

### Optional Arguments
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

### Rest Arguments
You may be wondering why the example `reason` I've been using thus far has just been the word "mean". Surely "being mean" or "spamming some meme stock" would be a better, more descriptive reason. But if we were to try that now...

```
> !ban @someAnnoyingUser being mean
< Banning Some Annoying User for being
```

The `args.reason` passed to our `execute` function is just the first word of the reason; the rest gets ignored since as far as our command definition is concerned, this command accepts 2 commands and we were passed 3.

To fix this, we can define `reason` as a "rest" argument, by prepending our arguments name with `...`. With rest arguments, the _rest_ of the message gets interpreted as of the value of the argument.

```js
   const bot = Solaire.create({
    ...
    commands: {
      'ban <user> [...reason]': {
        async execute({ args, message }) {
         // message: Discord.js::Message
         // args.user: string
         // args.reason: string[]

         const user = await message.guild.members.fetch(args.user);

         message.channel.send(`Banning ${user.displayName} ${args.reason
           ? `for ${args.reason.join(' ')}`
           : ''
         }`);

         user.ban({ reason: args.reason?.join(' ') })
        }
      }
    }
  })
```

```
> !ban @someAnnoyingUser being mean
< Banning Some Annoying User for being mean
```

### Argument Types
Another issue with our command is that we're just assuming that the user is going to pass us valid arguments when they invoke it, when they may very well pass in some nonsense.

```
> !ban :)
>>>>> Uncaught TypeError: Could not read property 'displayName' of undefined
```

We couldn't resolve the passed in user to an actual Discord user, and our program crashed. Of course we could do our own validation of this variable and bail out before trying to use the `user`, but who wants to do that?

Instead, we can define a type for our argument, by appending the argument name with `:` plus the name of the type.

```js
   const bot = Solaire.create({
    ...
    commands: {
      'ban <user:GuildMember> [...reason]': {
        async execute({ args, message }) {
         // message: Discord.js::Message
         // args.user: Discord.js::GuildMember
         // args.reason: string[]

         message.channel.send(`Banning ${args.user.displayName} ${args.reason
           ? `for ${args.reason.join(' ')}`
           : ''
         }`);

         user.ban({ reason: args.reason?.join(' ') })
        }
      }
    }
  })
```

Typing our argument provides two substantial benefits to our command's definition

- It validates that the passed in value is valid
- It automatically parses the argument and fits it to its type, transforming the value to a more convenient data type before passing off control to the `execute` function. In this case, Solaire automatically resolved the user ID that we pass into the `ban` command to a `GuildMember` object.
- It provides documentation for how our command is supposed to be used

Now, if we try to pass an invalid value for the `user`, Solaire automatically responds with the issue.

```
> !ban :)
< Invalid value :) provided for arg user of type GuildMember
```

> Aside: I know some users may not want Solaire to automatically respond with this error and would instead prefer to handle the error themselves. This functionality is coming, and Solaire's automated responses will likely become opt-in.

The available argument types are:

| Argument Type | Validation                                                               | Resolved JS Type          |
|---------------|--------------------------------------------------------------------------|---------------------------|
| Int           | Validates using `parseInt`                                               | `Number`                  |
| Float         | Validates using `parseFloat`                                             | `Number`                  |
| GuildMember   | Validates that ID passed in resolves to a member of the message's server | `Discord.js::GuildMember` |

If no argument type is provided, the arg is just passed through as a string.

