import { MAX_TELEGRAM_CONTENT_LENGTH } from '../constants/index.js';

/**
 * Splits a given message into chunks of MAX_TELEGRAM_CONTENT_LENGTH size.
 * This is necessary because Telegram has a limit on the size of messages
 * that can be sent.
 *
 * @param {string} message - The message to be split.
 * @returns {Array<string>} - An array of strings, each of length
 *   MAX_TELEGRAM_CONTENT_LENGTH or less.
 */
export const splitMessageForTelegram = message => {
  const chunkSize = MAX_TELEGRAM_CONTENT_LENGTH;
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
};
