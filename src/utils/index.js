import { MAX_TELEGRAM_CONTENT_LENGTH } from '../constants/index.js';
import { getChatHistory } from '../services/supabase.js';

export const splitMessageForTelegram = message => {
  if (message.length <= MAX_TELEGRAM_CONTENT_LENGTH) return [message];

  const chunks = message.split('\n').filter(chunk => chunk.length);

  return chunks;
};

export const createMessagesHistory = async chatId => {
  const history = await getChatHistory(chatId);

  return history;
};
