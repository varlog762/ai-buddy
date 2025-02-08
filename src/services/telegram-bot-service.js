import TelegramBot from 'node-telegram-bot-api';
import { MESSAGE, MESSAGE_FROM_TG } from '../constants/index.js';

class TelegramBotService {
  chatList = new Set();

  constructor(token, eventEmitter) {
    this.bot = new TelegramBot(this.token, { polling: true });
    this.token = token;
    this.eventEmitter = eventEmitter;
  }

  startListenMessages() {
    this.bot.on(MESSAGE, msg => {
      const chatId = msg.chat.id;
      const message = msg.text;

      this.chatList.add(chatId);

      this.eventEmitter.emit(MESSAGE_FROM_TG, { chatId, message });
    });
  }

  sendToAll(message) {
    this.chatList.forEach(chatId => this.bot.sendMessage(chatId, message));
  }

  sendMessage(chatId, message) {
    this.bot.sendMessage(chatId, message);
  }
}

export default TelegramBotService;
