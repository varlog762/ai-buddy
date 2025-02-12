import TelegramBot from 'node-telegram-bot-api';
import {
  MESSAGE,
  MESSAGE_FROM_TG,
  USER_ROLE,
  SOMETHING_WENT_WRONG,
  CLEAR_CHAT_HISTORY,
} from '../constants/index.js';
// import { splitMessageForTelegram } from '../utils/index.js';

class TelegramBotService {
  chatList = new Set();

  /**
   * Constructs a TelegramBotService instance.
   *
   * @param {string} token - The Telegram Bot API token.
   * @param {EventEmitter} eventEmitter - The event emitter to emit events to.
   */
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
      const message = msg.text;
      console.log(message);

      setTimeout(() => this.bot.sendChatAction(chatId, 'typing'), 700);

      this.handleMessages(chatId, message);
    });
  }

  handleMessages(chatId, message) {
    switch (message) {
      case '/start':
        this.handleStartCommand(chatId);
        break;
      case '/clear':
        this.emit(CLEAR_CHAT_HISTORY, chatId);
        break;
      default:
        this.emit(MESSAGE_FROM_TG, { chatId, message, role: USER_ROLE });
    }
  }

  /**
   * Sends a message to a specific chat ID.
   *
   * @param {Object} params - The parameters for sending a message.
   * @param {number} params.chatId - The ID of the chat where the message will be sent.
   * @param {string} params.message - The message to be sent.
   */
  async send({ chatId, message }) {
    try {
      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      // const messages = splitMessageForTelegram(message);
      // // eslint-disable-next-line no-restricted-syntax
      // for (const msg of messages) {
      //   // eslint-disable-next-line no-await-in-loop
      //   await this.bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      // }
    } catch (error) {
      await this.bot.sendMessage(chatId, SOMETHING_WENT_WRONG);
      console.error(error);
    }
  }

  emit(event, payload) {
    this.eventEmitter.emit(event, payload);
  }

  handleStartCommand(chatId) {}
}

export default TelegramBotService;
