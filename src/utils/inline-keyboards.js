import { AI_MODELS } from '../constants/index.js';

export const modelSelectionKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Llama 3.1 70b', callback_data: AI_MODELS.LLAMA }],
      [{ text: 'Gemini 2.0', callback_data: AI_MODELS.GEMINI }],
      [{ text: 'DeepSeek R1', callback_data: AI_MODELS.DEEPSEEK }],
    ],
  },
};

export const defaultOptionKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🔄 Change Model', callback_data: 'change-model' }],
      [{ text: '✅ Keep Default', callback_data: 'keep-default' }],
    ],
  },
};
