// TODO: delete 'telegramify-markdown' or 'markdown-it' from project
// import telegramifyMarkdown from 'telegramify-markdown';
import markdownit from 'markdown-it';
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
  const md = markdownit({
    html: false,
    breaks: true,
  });
  const formattedMessage = md.renderInline(message);
  return deleteBrTags(formattedMessage);
};
// telegramifyMarkdown(message, formatOption);

export const isCommand = message => COMMANDS_SET.has(message);
export const isModel = userSelection => AI_MODELS_SET.has(userSelection);
