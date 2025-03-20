import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { ErrorMessages, ChatRoles, AiModels } from '../enums';

const { SUPABASE_URL, SUPABASE_API_KEY } = process.env;

export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_API_KEY as string
);

export const saveMessageToDB = async ({ chatId, role, message }) => {
  if (message === ErrorMessages.SOMETHING_WRONG) return;

  const { error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, role, content: message }]);

  if (error) {
    console.error(ErrorMessages.DATABASE_SAVING, error.message);
  }
};

export const getCurrentModelName = async (
  chatId: number
): Promise<AiModels | null> => {
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('model')
    .eq('chat_id', chatId)
    .single();

  if (chatError) {
    console.error(`${ErrorMessages.GET_LLM_NAME}: ${chatError.message}`);
    return null;
  }

  return chatData.model;
};

export const getCurrentSystemMessage = async (
  chatId: number
): Promise<string | null> => {
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('system_message')
    .eq('chat_id', chatId)
    .single();

  if (chatError) {
    console.error(`${ErrorMessages.GET_SYSTEM_MESSAGE}: ${chatError.message}`);
    return null;
  }

  return chatData.system_message;
};

export const getChatHistory = async (chatId: number) => {
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error(`${ErrorMessages.CHAT_DATA}: ${messagesError.message}`);
    return null;
  }

  return messages;
};

export const deleteChatHistory = async (chatId: number) => {
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);

  if (messagesError) {
    console.error(
      `${ErrorMessages.DELETE_CHAT_HISTORY}: ${messagesError.message}`
    );
  } else {
    console.log(`Successfully deleted history for chat ${chatId}`);
  }
};

export const updateLLM = async (chatId: number, model: AiModels) => {
  if (!model) {
    throw new Error(ErrorMessages.FALSY_LLM_NAME);
  }

  const { error } = await supabase
    .from('chats')
    .upsert({ chat_id: chatId, model }, { onConflict: ['chat_id'] });

  if (error) {
    console.error(ErrorMessages.UPDATE_MODEL, error.message);
  }
};

export const ensureChatExists = async (chatId: number) => {
  const { error } = await supabase
    .from('chats')
    .select('chat_id')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const { error: insertError } = await supabase.from('chats').insert({
        chat_id: chatId,
        // TODO: Implement System Message
        system_message: {
          role: ChatRoles.SYSTEM,
          content: '',
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
