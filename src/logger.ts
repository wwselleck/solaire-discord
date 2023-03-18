const build = (msg: string, level: string) => `solaire-discord:${level} ${msg}`;
export const logger = {
  info: (msg: string) => {
    console.log(build(msg, 'info'));
  },
  error: (msg: string) => {
    console.log(build(msg, 'error'));
  }
};
