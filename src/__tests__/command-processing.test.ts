import {
  parseCommandMessage,
  buildExecuteArgs,
  MissingRequiredArgumentError,
} from "../command-processing";

describe("parseCommandMessage", () => {
  it("should correctly parse a valid command message with a prelude", () => {
    const res = parseCommandMessage("!ping hello there", "!");
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: "ping",
      args: ["hello", "there"],
    });
  });

  it("should correctly parse a valid command message without a prelude", () => {
    const res = parseCommandMessage("!ping hello there");
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: "!ping",
      args: ["hello", "there"],
    });
  });

  it("should correctly parse a valid command message without args", () => {
    const res = parseCommandMessage("!ping", "!");
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: "ping",
      args: [],
    });
  });

  it("should correctly parse a valid command message without args and trailing whitespace", () => {
    const res = parseCommandMessage("!ping   ", "!");
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: "ping",
      args: [],
    });
  });

  it("should fail if the message is not a command", () => {
    const res = parseCommandMessage("ping hello there", "!");
    expect(res.success).toEqual(false);
  });

  it("should consider leading whitespace when determining prelude match", () => {
    let res = parseCommandMessage("  !ping hello there", "!");
    expect(res.success).toEqual(false);

    res = parseCommandMessage(" !ping hello there", " !");
    expect(res.success).toEqual(true);
  });
});

describe("buildExecuteArgs", () => {
  it("should correctly build valid args", () => {
    const messageArgs = ["a", "b"];
    const commandArgs = [
      {
        name: "X",
        required: false,
      },
      {
        name: "Y",
        required: false,
      },
    ];

    const res = buildExecuteArgs(messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      X: "a",
      Y: "b",
    });
  });

  it("should build args if optional arg is missing", () => {
    const messageArgs = ["a"];
    const commandArgs = [
      {
        name: "X",
        required: true,
      },
      {
        name: "Y",
        required: false,
      },
    ];

    const res = buildExecuteArgs(messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      X: "a",
    });
  });
  it("should fail if a required arg is missing", () => {
    const messageArgs = ["a"];
    const commandArgs = [
      {
        name: "X",
        required: true,
      },
      {
        name: "Y",
        required: true,
      },
    ];

    const res = buildExecuteArgs(messageArgs, commandArgs);

    expect(res.success).toEqual(false);
    expect((res as any).error).toBeInstanceOf(MissingRequiredArgumentError);
    expect((res as any).error.argName).toEqual("Y");
  });
});
