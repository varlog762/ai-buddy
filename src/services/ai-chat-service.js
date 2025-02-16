import OpenAI from 'openai';
import { EVENTS, CHAT_ROLES, ERRORS } from '../constants/index.js';
import { getChatModel, getChatHistory } from './supabase.js';

class AIChatService {
  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId }) {
    try {
      const model = await getChatModel(chatId);
      if (!model) throw new Error(ERRORS.FALSY_MODEL);

      const messages = await getChatHistory(chatId);

      const completion = await this.bot.chat.completions.create({
        model,
        messages,
      });

      const responseMessage = completion?.choices[0]?.message?.content;

      this.emit(chatId, responseMessage);
    } catch (error) {
      this.emit(chatId, ERRORS.SOMETHING_WRONG);
      console.error(error);
    }
  }

  emit(chatId, message) {
    this.eventEmitter.emit(EVENTS.MESSAGE_FROM_AI, {
      chatId,
      message,
      role: CHAT_ROLES.ASSISTANT,
    });
  }
}

export default AIChatService;
