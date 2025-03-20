import OpenAI from 'openai';
import { Events, ChatRoles, ErrorMessages } from '../enums';
import {
  getCurrentModelName,
  getChatHistory,
  getCurrentSystemMessage,
} from './supabase.js';
import EventEmitter from 'node:events';

class AIChatService {
  bot: OpenAI;
  eventEmitter: EventEmitter;

  constructor(baseURL: string, apiKey: string, eventEmitter: EventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send(chatId: number) {
    try {
      const options = await this.getChatOptions(chatId);

      const completion = await this.bot.chat.completions.create(options);

      const messageContent = completion.choices[0]?.message?.content;

      if (messageContent) {
        this.emit(chatId, messageContent);
      }
    } catch (err) {
      this.emit(chatId, ErrorMessages.SOMETHING_WRONG);
      console.error(err);
    }
  }

  async getChatOptions(chatId: number) {
    const currentModelName: string = await getCurrentModelName(chatId);

    const chatHistory = await getChatHistory(chatId);

    const currentSystemMessage = await getCurrentSystemMessage(chatId);

    if (!currentModelName) {
      throw new Error(ErrorMessages.FALSY_LLM_NAME);
    }

    if (!chatHistory) {
      throw new Error(ErrorMessages.CHAT_DATA);
    }

    const messages = currentSystemMessage
      ? [currentSystemMessage, ...chatHistory]
      : chatHistory;

    return { model: currentModelName, messages };
  }

  emit(chatId: number, message: string | ErrorMessages): void {
    this.eventEmitter.emit(Events.MESSAGE_TO_TG, {
      chatId,
      message,
      role: ChatRoles.ASSISTANT,
    });
  }
}

export default AIChatService;
