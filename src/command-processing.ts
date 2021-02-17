import { Command } from "./command";

/**
 * Take a content string and return the command tokens
 *
 * Example:
 *
 * Prelude: !
 * Message: !trivia c
 * Return: [trivia, c]
 *
 * Prelude:
 * Message: !trivia c
 * Return: [!trivia, c]
 *
 */
const extractCommandTokens = (prelude: string, message: string) => {
  if (!message.startsWith(prelude)) {
    return message.split(" ");
  }

  // Remove the prelude
  let re = new RegExp(`^(${prelude})`);
  let messageWithoutPrelude = message.replace(re, "");

  return messageWithoutPrelude.split(" ");
};
