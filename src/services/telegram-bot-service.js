import TelegramBot from 'node-telegram-bot-api';
import { MESSAGE, MESSAGE_FROM_TG } from '../constants/index.js';

class TelegramBotService {
  chatList = new Set();

  constructor(token, eventEmitter) {
    this.bot = new TelegramBot(token, { polling: true });
    this.eventEmitter = eventEmitter;
  }

  /**
   * Starts listening for messages in the Telegram Bot API.
   *
   * Once a message is received, it is processed and an event is emitted
   * with the chat ID and message.
   */
  startListenMessages() {
    this.bot.on(MESSAGE, msg => {
      const chatId = msg.chat.id;
      console.log(chatId);
      const message = msg.text;

      this.chatList.add(chatId);

      this.eventEmitter.emit(MESSAGE_FROM_TG, { chatId, message });
    });
  }

  /**
   * Sends a message to all chat IDs stored in the chatList.
   *
   * @param {string} message - The message to be sent to all chat IDs.
   */
  sendToAll(message) {
    try {
      this.chatList.forEach(chatId =>
        this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
      );
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends a message to a specific chat ID.
   *
   * @param {Object} params - The parameters for sending a message.
   * @param {number} params.chatId - The ID of the chat where the message will be sent.
   * @param {string} params.message - The message to be sent.
   */
  send({ chatId, message }) {
    try {
      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(error);
    }
  }
}

export default TelegramBotService;
