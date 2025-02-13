import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  SOMETHING_WENT_WRONG,
  DATABASE_SAVING_ERROR,
  CHAT_DATA_ERROR,
} from '../constants/index.js';

const { SUPABASE_URL, SUPABASE_API_KEY } = process.env;

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

/**
 * Saves a message to the database. If the message is equal to
 * SOMETHING_WENT_WRONG, the function returns immediately.
 *
 * @param {Object} params - The parameters for saving a message.
 * @param {number} params.chatId - The ID of the chat where the message was sent.
 * @param {string} params.role - The role of the sender of the message.
 * @param {string} params.message - The content of the message.
 *
 * @returns {Promise<void>} A promise that resolves if the message is saved
 * successfully, and rejects if there is an error.
 */
export const saveMessageToDB = async ({ chatId, role, message }) => {
  if (message === SOMETHING_WENT_WRONG) return;

  const { error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, role, content: message }]);

  if (error) {
    console.error(DATABASE_SAVING_ERROR, error.message);
  }
};

export const getChatData = async chatId => {
  if (!chatId) return null;

  const { data, error } = await supabase
    .from('chats')
    .select('model, messages:messages(role, content)')
    .eq('chat_id', chatId)
    .order('messages.created_at', { ascending: true }) // сортируем сообщения по времени
    .single();

  if (error) {
    console.error(`${CHAT_DATA_ERROR}: ${error.message}`);
    return [];
  }

  return data;
};

export const updateLLM = async (chatId, model) => {
  if (!chatId) {
    return;
  }

  if (!model) {
    throw new Error('Model cannot be null or undefined');
  }

  const { error } = await supabase
    .from('chats')
    .upsert({ chat_id: chatId, model }, { onConflict: ['chat_id'] });

  if (error) {
    console.error('Error updating model:', error.message);
  }
};
