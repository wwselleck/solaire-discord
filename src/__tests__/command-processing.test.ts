import {
  parseCommandMessage,
  buildExecuteArgs,
  MissingRequiredArgumentError,
  InvalidArgValue
} from '../command-processing';
import { MockMessage } from '../../test/discord-mocks';

describe('parseCommandMessage', () => {
  it('should correctly parse a valid command message with a prelude', () => {
    const res = parseCommandMessage('!ping hello there', '!');
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: 'ping',
      args: ['hello', 'there']
    });
  });

  it('should correctly parse a valid command message without a prelude', () => {
    const res = parseCommandMessage('!ping hello there');
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: '!ping',
      args: ['hello', 'there']
    });
  });

  it('should correctly parse a valid command message without args', () => {
    const res = parseCommandMessage('!ping', '!');
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: 'ping',
      args: []
    });
  });

  it('should correctly parse a valid command message without args and trailing whitespace', () => {
    const res = parseCommandMessage('!ping   ', '!');
    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      name: 'ping',
      args: []
    });
  });

  it('should fail if the message is not a command', () => {
    const res = parseCommandMessage('ping hello there', '!');
    expect(res.success).toEqual(false);
  });

  it('should consider leading whitespace when determining prelude match', () => {
    let res = parseCommandMessage('  !ping hello there', '!');
    expect(res.success).toEqual(false);

    res = parseCommandMessage(' !ping hello there', ' !');
    expect(res.success).toEqual(true);
  });
});

describe('buildExecuteArgs', () => {
  it('should correctly build valid args', () => {
    const messageArgs = ['a', 'b'];
    const commandArgs = [
      {
        name: 'X',
        required: false
      },
      {
        name: 'Y',
        required: false
      }
    ];

    const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      X: 'a',
      Y: 'b'
    });
  });

  it('should correctly build args with rest arg', () => {
    const messageArgs = ['weston', 'this', 'is', 'a', 'test'];
    const commandArgs = [
      {
        name: 'user',
        required: true
      },
      {
        name: 'text',
        required: true,
        rest: true
      }
    ];

    const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      user: 'weston',
      text: 'this is a test'
    });
  });

  it('should build args if optional arg is missing', () => {
    const messageArgs = ['a'];
    const commandArgs = [
      {
        name: 'X',
        required: true
      },
      {
        name: 'Y',
        required: false
      }
    ];

    const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      X: 'a'
    });
  });

  it('should build args if some optional args are missing', () => {
    const messageArgs = ['a', 'b'];
    const commandArgs = [
      {
        name: 'X',
        required: true
      },
      {
        name: 'Y',
        required: false
      },
      {
        name: 'Z',
        required: false
      },
      {
        name: 'N',
        required: false
      }
    ];

    const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);

    expect(res.success).toEqual(true);
    expect((res as any).result).toEqual({
      X: 'a',
      Y: 'b'
    });
  });

  it('should fail if a required arg is missing', () => {
    const messageArgs = ['a'];
    const commandArgs = [
      {
        name: 'X',
        required: true
      },
      {
        name: 'Y',
        required: true
      }
    ];

    const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);

    expect(res.success).toEqual(false);
    expect((res as any).error).toBeInstanceOf(MissingRequiredArgumentError);
    expect((res as any).error.argName).toEqual('Y');
  });

  describe('type resolving', () => {
    it('should resolve an arg with no type as a string', () => {
      const messageArgs = ['abc'];
      const commandArgs = [
        {
          name: 'X'
        }
      ];

      const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);
      expect((res as any).result).toEqual({
        X: 'abc'
      });
    });

    it("should resolve an arg with a 'Int' type as an int", () => {
      const messageArgs = ['2'];
      const commandArgs = [
        {
          name: 'X',
          type: 'Int'
        }
      ];

      const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);
      expect((res as any).result).toEqual({
        X: 2
      });
    });

    it("should resolve an arg with a 'GuildMember' type as a GuildMember", () => {
      const messageArgs = ['<@!abc123>'];
      const commandArgs = [
        {
          name: 'user',
          type: 'GuildMember'
        }
      ];

      const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);
      expect((res as any).result).toEqual({
        user: {
          id: 'abc123'
        }
      });
    });

    it("should resolve an arg with a 'Date' type as a Date", () => {
      const messageArgs = ['12/2/1980'];
      const commandArgs = [
        {
          name: 'date',
          type: 'Date'
        }
      ];

      const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);
      expect((res as any).result.date.getTime()).toEqual(
        new Date('12/2/1980').getTime()
      );
    });

    it("should return an error if an arg of type 'Int' is passed a non-int value", () => {
      const messageArgs = ['abdf'];
      const commandArgs = [
        {
          name: 'X',
          type: 'Int'
        }
      ];

      const res = buildExecuteArgs(MockMessage(), messageArgs, commandArgs);
      expect(res.success).toEqual(false);
      expect((res as any).error instanceof InvalidArgValue).toEqual(true);
    });
  });
});
