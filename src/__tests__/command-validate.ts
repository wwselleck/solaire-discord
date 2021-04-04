import { Command } from "../command";
import {
  validateCommand,
  ArgPositionError,
  DuplicateArgError,
} from "../command-validate";

const testArg = {
  name: "testArg",
};
const testRestArg = {
  name: "testRestArg",
  rest: true,
};

const createTestCommand = (props?: Partial<Command>) => {
  return {
    name: "test",
    aliases: ["t"],
    args: [
      {
        name: "arg1",
      },
    ],
    execute: jest.fn(),
    ...props,
  };
};

describe("validateCommand", () => {
  it("should throw an error if a rest arg is present but not the final arg", () => {
    const command = createTestCommand({
      args: [testRestArg, testArg],
    });
    expect(() => validateCommand(command)).toThrow(ArgPositionError);
  });

  it("should throw an error if multiple args have the same name", () => {
    const command = createTestCommand({
      args: [testArg, testArg],
    });
    expect(() => validateCommand(command)).toThrow(DuplicateArgError);
  });
});
