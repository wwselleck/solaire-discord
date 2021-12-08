import { parseCommandString } from '../command';

describe('parseCommandString', () => {
  it('parses a command with one name', () => {
    const str = 'play';
    expect(parseCommandString(str).name).toEqual('play');
  });

  it('correctly adds secondary names as aliases', () => {
    const str = 'play|p|pl';
    expect(parseCommandString(str).aliases).toEqual(['p', 'pl']);
  });

  it('parses required args correctly', () => {
    const str = 'play|p|pl <url>';
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: 'url',
        required: true
      }
    ]);
  });

  it('parses optional args correctly', () => {
    const str = 'play|p|pl [url]';
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: 'url',
        required: false
      }
    ]);
  });

  it('errors when an arg is not surrounded by valid chars', () => {
    const str = 'cmd *url*';
    expect(() => parseCommandString(str)).toThrow();
  });

  it('parses multiple args correctly', () => {
    const str = 'play|p|pl <url> [shuffle]';
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: 'url',
        required: true
      },
      {
        name: 'shuffle',
        required: false
      }
    ]);
  });

  it('parses a rest arg correctly', () => {
    const str = 'log <user> <...text>';
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: 'user',
        required: true
      },
      {
        name: 'text',
        required: true,
        rest: true
      }
    ]);
  });

  it('parses an arg type correctly', () => {
    const str = 'log <user:Member>';
    const res = parseCommandString(str);
    expect(res.args).toEqual([
      {
        name: 'user',
        required: true,
        type: 'Member'
      }
    ]);
  });

  it('errors if a rest arg is given a type', () => {
    const str = 'log <...text:Member>';
    expect(() => parseCommandString(str)).toThrow();
  });
});
