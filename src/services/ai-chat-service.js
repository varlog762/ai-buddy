import OpenAI from 'openai';
import {
  MESSAGE_FROM_AI,
  ASSISTANT_ROLE,
  SOMETHING_WENT_WRONG,
} from '../constants/index.js';
import { getChatData } from './supabase.js';

class AIChatService {
  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId }) {
    try {
      const { messages, model } = await getChatData(chatId);

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
