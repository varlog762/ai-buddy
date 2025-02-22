import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  ERRORS,
  CHAT_ROLES,
  SYSTEM_MESSAGE_FOR_LLM,
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
  if (message === ERRORS.SOMETHING_WRONG) return;

  const { error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, role, content: message }]);

  if (error) {
    console.error(ERRORS.DATABASE_SAVING, error.message);
  }
};

export const getCurrentModelName = async chatId => {
  if (!chatId) return null;

  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('model')
    .eq('chat_id', chatId)
    .single();

  if (chatError) {
    console.error(`${ERRORS.GET_LLM_NAME}: ${chatError.message}`);
    return null;
  }

  return chatData.model;
};

export const getCurrentSystemMessage = async chatId => {
  if (!chatId) return null;

  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('system_message')
    .eq('chat_id', chatId)
    .single();

  if (chatError) {
    console.error(`${ERRORS.GET_SYSTEM_MESSAGE}: ${chatError.message}`);
    return null;
  }

  return chatData.system_message;
};

export const getChatHistory = async chatId => {
  if (!chatId) return null;

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error(`${ERRORS.CHAT_DATA}: ${messagesError.message}`);
    return null;
  }

  return messages;
};

export const deleteChatHistory = async chatId => {
  if (!chatId) return;

  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);

  if (messagesError) {
    console.error(`${ERRORS.DELETE_CHAT_HISTORY}: ${messagesError.message}`);
  } else {
    console.log(`Successfully deleted history for chat ${chatId}`);
  }
};

export const updateLLM = async (chatId, model) => {
  if (!chatId) {
    return;
  }

  if (!model) {
    throw new Error(ERRORS.FALSY_LLM_NAME);
  }

  const { error } = await supabase
    .from('chats')
    .upsert({ chat_id: chatId, model }, { onConflict: ['chat_id'] });

  if (error) {
    console.error(ERRORS.UPDATE_MODEL, error.message);
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
      const { error: insertError } = await supabase.from('chats').insert({
        chat_id: chatId,

        system_message: {
          role: CHAT_ROLES.SYSTEM,
          content: SYSTEM_MESSAGE_FOR_LLM,
        },
      });

      if (insertError) {
        console.error('Ошибка создания чата:', insertError.message);
      }
    } else {
      console.error('Ошибка проверки чата:', error.message);
    }
  }
};
