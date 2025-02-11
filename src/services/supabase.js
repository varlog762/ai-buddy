import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  SOMETHING_WENT_WRONG,
  DATABASE_SAVING_ERROR,
} from '../constants/index.js';

const { SUPABASE_URL, SUPABASE_API_KEY } = process.env;

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

export const saveMessageToDB = async ({ chatId, role, message }) => {
  if (message === SOMETHING_WENT_WRONG) return;

  const { error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, role, content: message }]);

  if (error) {
    console.error(DATABASE_SAVING_ERROR, error.message);
  }
};
