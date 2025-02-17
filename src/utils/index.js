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

export const formatMarkdownMessage = (message = '') => {
  const escapeChars = [
    '_',
    '*',
    '[',
    ']',
    '(',
    ')',
    '~',
    '`',
    '>',
    '#',
    '+',
    '-',
    '=',
    '|',
    '{',
    '}',
    '.',
    '!',
  ];

  return message.replace(/([_*[\]()~`>#\\+=|{}.!-])/g, '\\$1');
};

export const isCommand = message => COMMANDS_SET.has(message);
export const isModel = userSelection => AI_MODELS_SET.has(userSelection);
