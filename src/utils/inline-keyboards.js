import { LLAMA, DEEPSEEK, GEMINI } from '../constants/index.js';

export const modelSelectionKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Llama 3.1 70b', callback_data: LLAMA }],
      [{ text: 'Gemini 2.0', callback_data: GEMINI }],
      [{ text: 'DeepSeek R1', callback_data: DEEPSEEK }],
    ],
  },
};

export const defaultOptionKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🔄 Change Model', callback_data: 'change_model' }],
      [{ text: '✅ Keep Default', callback_data: 'keep_default' }],
    ],
  },
};
