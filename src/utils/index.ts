// TODO: delete 'telegramify-markdown' or 'markdown-it' from project
import telegramifyMarkdown from 'telegramify-markdown';
// import markdownit from 'markdown-it';
import { MAX_TELEGRAM_CONTENT_LENGTH } from '../constants/index';
import { ChatCommands, AiModels } from '../enums/index';

export const splitMessageForTelegram = (message: string): string[] => {
  if (message.length <= MAX_TELEGRAM_CONTENT_LENGTH) return [message];

  const chunks = message.split('\n').filter(chunk => chunk.length);

  return chunks;
};

// const deleteBrTags = message => message.replace(/<br>/g, '');

export const escapeMarkdownV2 = (text: string): string =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

export const formatMarkdownMessageToHtml = (message: string = ''): string => {
  // const md = markdownit({
  //   html: false,
  //   breaks: true,
  // });
  // const formattedMessage = md.renderInline(message);
  // return deleteBrTags(formattedMessage);
  return telegramifyMarkdown(message, 'escape');
};

export const isCommand = (message: string | ChatCommands): boolean =>
  Object.values(ChatCommands).includes(message as ChatCommands);

export const isModel = (userSelection: string | AiModels) =>
  Object.values(AiModels).includes(userSelection as AiModels);

/**
 * Checks if a given text exceeds the maximum allowed length for a Telegram message.
 *
 * @param {string} text - The text to check.
 * @param {number} [maxLength=MAX_TELEGRAM_CONTENT_LENGTH] - The maximum allowed length.
 * @returns {boolean} If the text exceeds the maximum allowed length.
 */
const isTextExceedingLimit = (
  text: string,
  maxLength = MAX_TELEGRAM_CONTENT_LENGTH
): boolean => text.length > maxLength;

const findLastIndexOf = (needle: string, haystack: string): number | null => {
  if (
    typeof needle !== 'string' ||
    typeof haystack !== 'string' ||
    needle === ''
  ) {
    return null;
  }

  const lastIndex = haystack.lastIndexOf(needle);

  return lastIndex === -1 ? null : lastIndex + 1;
};

export const handleLongText = (
  text: string,
  maxLength = MAX_TELEGRAM_CONTENT_LENGTH
): string[] => {
  if (!text) return [];

  if (!isTextExceedingLimit(text, maxLength)) return [text];

  let remainingText = text;
  const chunks = [];

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

export const convertBlobToBuffer = async (blob: Blob): Promise<Buffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer;
};
