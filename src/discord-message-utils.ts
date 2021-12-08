// See: https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
export function getIdFromMention(mention: string) {
  if (!mention) return;

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    let mentionWithoutSurrounding = mention.slice(2, -1);

    if (mentionWithoutSurrounding.startsWith('!')) {
      mentionWithoutSurrounding = mentionWithoutSurrounding.slice(1);
    }

    return mentionWithoutSurrounding;
  }
}

export function buildUserMentionFromId(id: string) {
  return `<@${id}>`;
}
