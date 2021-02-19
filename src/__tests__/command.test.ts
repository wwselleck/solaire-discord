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

  it("parses required args correctly", () => {
    const str = "play|p|pl <url>";
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: "url",
        required: true,
      },
    ]);
  });

  it("parses optional args correctly", () => {
    const str = "play|p|pl [url]";
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: "url",
        required: false,
      },
    ]);
  });

  it("parses multiple args correctly", () => {
    const str = "play|p|pl <url> [shuffle]";
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: "url",
        required: true,
      },
      {
        name: "shuffle",
        required: false,
      },
    ]);
  });
});
