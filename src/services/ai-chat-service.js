import OpenAI from 'openai';
import {
  MESSAGE_FROM_AI,
  USER_ROLE,
  SYSTEM_ROLE,
  GEMINI,
  DEEPSEEK,
  LLAMA,
  ASSISTANT_ROLE,
  SOMETHING_WENT_WRONG,
} from '../constants/index.js';
import { createMessagesHistory } from '../utils/index.js';

class AIChatService {
  models = [GEMINI, LLAMA, DEEPSEEK];

  currentModelIdx = 0;

  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId }) {
    try {
      const model = this.models[this.currentModelIdx];
      const messages = await createMessagesHistory(chatId);

      const completion = await this.bot.chat.completions.create({
        model,
        messages,
      });

      const responseMessage = completion?.choices[0]?.message?.content;

      this.emit(chatId, responseMessage);
    } catch (error) {
      this.emit(chatId, SOMETHING_WENT_WRONG);
      console.error(error);
    }
  }

  emit(chatId, message) {
    this.eventEmitter.emit(MESSAGE_FROM_AI, {
      chatId,
      message,
      role: ASSISTANT_ROLE,
    });
  }
}

export default AIChatService;
