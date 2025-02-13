import { MAX_TELEGRAM_CONTENT_LENGTH } from '../constants/index.js';
import { getChatData } from '../services/supabase.js';

export const splitMessageForTelegram = message => {
  if (message.length <= MAX_TELEGRAM_CONTENT_LENGTH) return [message];

  const chunks = message.split('\n').filter(chunk => chunk.length);

  return chunks;
};
