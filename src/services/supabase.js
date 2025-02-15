import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  SOMETHING_WENT_WRONG,
  DATABASE_SAVING_ERROR,
  CHAT_DATA_ERROR,
  FALSY_MODEL_ERROR,
  LLAMA,
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

// TODO: separate this to a 2 methods
export const getChatData = async chatId => {
  if (!chatId) return null;

  // Получаем текущую модель чата
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('model')
    .eq('chat_id', chatId)
    .single();

  if (chatError) {
    console.error(`${CHAT_DATA_ERROR}: ${chatError.message}`);
    return null;
  }

  // Получаем сообщения, отсортированные по времени
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error(`${CHAT_DATA_ERROR}: ${messagesError.message}`);
    return null;
  }

  return { model: chatData.model, messages };
};

export const updateLLM = async (chatId, model) => {
  if (!chatId) {
    return;
  }

  if (!model) {
    throw new Error(FALSY_MODEL_ERROR);
  }

  const { error } = await supabase
    .from('chats')
    .upsert({ chat_id: chatId, model }, { onConflict: ['chat_id'] });

  if (error) {
    console.error('Error updating model:', error.message);
  }
};

export const ensureChatExists = async chatId => {
  const { error } = await supabase
    .from('chats')
    .select('chat_id')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('chats')
        .insert({ chat_id: chatId, model: LLAMA });

      if (insertError) {
        console.error('Ошибка создания чата:', insertError.message);
      }
    } else {
      console.error('Ошибка проверки чата:', error.message);
    }
  }
};
