// TODO: delete 'telegramify-markdown' or 'markdown-it' from project
import telegramifyMarkdown from 'telegramify-markdown';
// import markdownit from 'markdown-it';
import {
  MAX_TELEGRAM_CONTENT_LENGTH,
  COMMANDS,
  AI_MODELS,
} from '../constants/index.js';

const COMMANDS_SET = new Set(Object.values(COMMANDS));
const AI_MODELS_SET = new Set(Object.values(AI_MODELS));

export const splitMessageForTelegram = message => {
  if (message.length <= MAX_TELEGRAM_CONTENT_LENGTH) return [message];

  const chunks = message.split('\n').filter(chunk => chunk.length);

  return chunks;
};

const deleteBrTags = message => message.replace(/<br>/g, '');

export const escapeMarkdownV2 = text =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

/**
 * Format a Markdown message according to the specified format option.
 *
 * @param {string} [formatOption] - The format option to apply to the message.
 *   Supported options are:
 *   - `'escape'`: Escape all Markdown syntax with backslashes.
 *   - `'remove'`: Remove all Markdown syntax from the message.
 *   - `'keep'`: Keep all Markdown syntax in the message.
 *   If not specified, this option defaults to `'keep'`.
 * @param {string} [message=''] - The Markdown message to format.
 * @returns {string} The formatted message.
 */
export const formatMarkdownMessageToHtml = (message = '') => {
  // const md = markdownit({
  //   html: false,
  //   breaks: true,
  // });
  // const formattedMessage = md.renderInline(message);
  // return deleteBrTags(formattedMessage);
  console.log('Formatted!');
  return telegramifyMarkdown(message);
};
// telegramifyMarkdown(message, formatOption);

export const isCommand = message => COMMANDS_SET.has(message);
export const isModel = userSelection => AI_MODELS_SET.has(userSelection);

/**
 * Checks if a given text exceeds the maximum allowed length for a Telegram message.
 *
 * @param {string} text - The text to check.
 * @param {number} [maxLength=MAX_TELEGRAM_CONTENT_LENGTH] - The maximum allowed length.
 * @returns {boolean} If the text exceeds the maximum allowed length.
 */
const isTextExceedingLimit = (text, maxLength = MAX_TELEGRAM_CONTENT_LENGTH) =>
  text.length > maxLength;

/**
 * Finds the last index of a substring in a given string.
 *
 * @param {string} needle - The substring to search for.
 * @param {string} haystack - The string to search in.
 * @returns {number} The last index of the substring in the string or null if not found.
 */
const findLastIndexOf = (needle, haystack) => {
  // Check for invalid inputs
  if (
    typeof needle !== 'string' ||
    typeof haystack !== 'string' ||
    needle === ''
  ) {
    return null;
  }

  // Find the last index of the substring
  const lastIndex = haystack.lastIndexOf(needle);

  // Return null if the substring was not found
  return lastIndex === -1 ? null : lastIndex + 1;
};

/**
 * Splits a given text into chunks of a maximum length allowed by Telegram.
 *
 * @param {string} text - The text to split.
 * @param {number} [maxLength=MAX_TELEGRAM_CONTENT_LENGTH] - The maximum allowed length.
 * @returns {string[]} An array of strings, each with a maximum length of maxLength.
 */
export const handleLongText = (
  text,
  maxLength = MAX_TELEGRAM_CONTENT_LENGTH
) => {
  if (!text) return [];

  if (!isTextExceedingLimit(text, maxLength)) return [text];

  let remainingText = text;
  const chunks = [];

  /**
   * Split the text into chunks of maximum length maxLength.
   * Try to split at the last occurrence of a newline or a period.
   * If no newline or period is found, split at maxLength.
   */
  while (remainingText.length > maxLength) {
    const currentChunk = remainingText.slice(0, maxLength);
    const splitIndex =
      findLastIndexOf('\n', currentChunk) ||
      findLastIndexOf('.', currentChunk) ||
      findLastIndexOf(' ', currentChunk) ||
      maxLength;

    const chunk = remainingText.slice(0, splitIndex);
    chunks.push(chunk);

    remainingText = remainingText.slice(splitIndex);

    if (!isTextExceedingLimit(remainingText, maxLength)) {
      chunks.push(remainingText);
      break;
    }
  }

  return chunks;
};
