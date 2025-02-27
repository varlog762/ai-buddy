import { AI_MODELS } from './index.js';

export const inlineKeyboards = {
  modelSelection: {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Llama 3.1 70b', callback_data: AI_MODELS.LLAMA }],
        [{ text: 'Gemini 2.0', callback_data: AI_MODELS.GEMINI }],
        [{ text: 'DeepSeek R1', callback_data: AI_MODELS.DEEPSEEK }],
      ],
    },
  },
  defaultOption: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Change Model', callback_data: 'change-model' }],
        [{ text: '✅ Keep Default', callback_data: 'keep-default' }],
      ],
    },
  },
  clearChatHistory: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Clear History', callback_data: 'clear-history' }],
        [{ text: '❌ Cancel', callback_data: 'cancel' }],
      ],
    },
  },
};
