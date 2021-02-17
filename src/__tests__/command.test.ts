import { parseCommandString } from "../command";

describe("parseCommandString", () => {
  it("parses a command with one name", () => {
    const str = "play";
    expect(parseCommandString(str).name).toEqual("play");
  });

  it("correctly adds secondary names as aliases", () => {
    const str = "play|p|pl";
    expect(parseCommandString(str).aliases).toEqual(["p", "pl"]);
  });
});
