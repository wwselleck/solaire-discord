import { GuildMember } from "discord.js";

type ArgTypes = {
  Int: number;
  Float: number;
  GuildMember: GuildMember;
};

type ArgOpeningChar = `<` | "[";
type ArgClosingChar = `>` | "]";
type ArgContentFormat = `${string}`;
type RequiredArgFormat = `<${ArgContentFormat}>`;
type OptionalArgFormat = `[${ArgContentFormat}]`;
type RestArgFormat = "...";
type ArgFormat = RequiredArgFormat | OptionalArgFormat;

type SplitArgs<Args extends string> = Args extends `${ArgFormat}${infer Rest}`
  ? Args extends `${infer Arg}${Rest}`
    ? Rest extends ` ${infer OtherArgs}`
      ? [
          Arg extends `${string} ${string}` ? never : Arg,
          ...SplitArgs<OtherArgs>
        ]
      : [Arg extends `${string} ${string}` ? never : Arg]
    : never
  : never;

type ParseArg<
  Arg extends ArgFormat
> = Arg extends `${ArgOpeningChar}${infer ArgContent}${ArgClosingChar}`
  ? ArgContent extends `${infer ArgName}:${infer ArgType}`
    ? ArgName extends `${RestArgFormat}${infer ArgName}`
      ? [
          ArgName,
          (ArgType extends keyof ArgTypes
            ? Arg extends `[${string}`
              ? ArgTypes[ArgType] | undefined
              : ArgTypes[ArgType]
            : never)[]
        ]
      : [
          ArgName,
          ArgType extends keyof ArgTypes
            ? Arg extends `[${string}`
              ? ArgTypes[ArgType] | undefined
              : ArgTypes[ArgType]
            : never
        ]
    : ArgContent extends `${RestArgFormat}${infer ArgName}`
    ? [ArgName, Arg extends `[${string}` ? (string | undefined)[] : string[]]
    : [ArgContent, Arg extends `[${string}` ? string | undefined : string]
  : never;

type ParseArgs<Args extends string[]> = {
  [P in keyof Args]: {
    [key in Args[P] extends ArgFormat
      ? ParseArg<Args[P]>[0]
      : never]: Args[P] extends ArgFormat ? ParseArg<Args[P]>[1] : never;
  };
};

type MergeObjectArray<T extends any[]> = T extends [
  infer First,
  infer Sec,
  ...infer Rest
]
  ? MergeObjectArray<[First & Sec, ...Rest]>
  : T extends [infer First]
  ? First
  : {};

export type CommandArgs<
  Command extends string
> = Command extends `${string} ${infer ArgsString}`
  ? MergeObjectArray<
      ParseArgs<SplitArgs<ArgsString>> extends any[]
        ? ParseArgs<SplitArgs<ArgsString>>
        : never
    >
  : never;
