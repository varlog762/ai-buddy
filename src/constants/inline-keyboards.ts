import { AiModels } from '../enums/ai-models';

export const inlineKeyboards = {
  modelSelection: {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Llama 3.1 70b', callback_data: AiModels.LLAMA }],
        [{ text: 'Gemini 2.0', callback_data: AiModels.GEMINI }],
        [{ text: 'DeepSeek R1', callback_data: AiModels.DEEPSEEK }],
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
