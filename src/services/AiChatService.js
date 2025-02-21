import OpenAI from 'openai';
import { EVENTS, CHAT_ROLES, ERRORS } from '../constants/index.js';
import {
  getCurrentModelName,
  getChatHistory,
  getCurrentSystemMessage,
} from './supabase.js';

class AIChatService {
  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId }) {
    try {
      const options = await this.getChatOptions(chatId);

      const { error, choices } =
        await this.bot.chat.completions.create(options);

      if (error) throw new Error(`${error.message}: code ${error.code}`);

      const messageContent = choices[0]?.message?.content;
      if (messageContent) this.emit(chatId, messageContent);
    } catch (err) {
      this.emit(chatId, ERRORS.SOMETHING_WRONG);
      console.error(err);
    }
  }

  /**
   * Retrieves chat options for a given chat ID.
   * This includes the current model name, chat history, and system message.
   *
   * @param {number} chatId - The ID of the chat for which to retrieve options.
   * @returns {Promise<Object>} An object containing the model name and messages.
   * @throws Will throw an error if the model name or chat history cannot be retrieved.
   */
  async getChatOptions(chatId) {
    // Fetch the current model name associated with the chat ID
    const currentModelName = await getCurrentModelName(chatId);

    // Fetch the chat history associated with the chat ID
    const chatHistory = await getChatHistory(chatId);

    // Fetch the current system message associated with the chat ID
    const currentSystemMessage = await getCurrentSystemMessage(chatId);

    // Throw an error if the model name is not available
    if (!currentModelName) {
      throw new Error(ERRORS.FALSY_LLM_NAME);
    }

    // Throw an error if the chat history is not available
    if (!chatHistory) {
      throw new Error(ERRORS.CHAT_DATA);
    }

    // Construct the messages array, including the system message if available
    const messages = currentSystemMessage
      ? [currentSystemMessage, ...chatHistory]
      : chatHistory;

    // Return the model name and messages as chat options
    return { model: currentModelName, messages };
  }

  /**
   * Emits a message event from the AI to the event emitter.
   *
   * @param {number} chatId - The ID of the chat where the message will be sent.
   * @param {string} message - The message content to be emitted.
   */
  emit(chatId, message) {
    // Emit an event indicating a message from the AI
    this.eventEmitter.emit(EVENTS.MESSAGE_FROM_AI, {
      chatId,
      message,
      role: CHAT_ROLES.ASSISTANT,
    });
  }
}

export default AIChatService;
