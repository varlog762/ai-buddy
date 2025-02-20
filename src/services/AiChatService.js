import OpenAI from 'openai';
import { EVENTS, CHAT_ROLES, ERRORS } from '../constants/index.js';
import { getCurrentModelName, getChatHistory } from './supabase.js';

class AIChatService {
  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId }) {
    try {
      const model = await getCurrentModelName(chatId);
      if (!model) throw new Error(ERRORS.FALSY_MODEL);

      const messages = await getChatHistory(chatId);
      if (!messages) throw new Error(ERRORS.CHAT_DATA);

      const { error, choices } = await this.bot.chat.completions.create({
        model,
        messages,
      });

      if (error) {
        console.log(error);
        throw new Error(`${error.message}: code ${error.code}`);
      }
      const responseMessage = choices[0]?.message?.content;
      if (responseMessage) this.emit(chatId, responseMessage);

      // if (!responseMessage) console.log(completion?.error);
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
