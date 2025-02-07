import TelegramBot from 'node-telegram-bot-api';

class TelegramBotService {
  chatList = new Set();

  constructor(token, eventEmitter) {
    this.bot = new TelegramBot(this.token, { polling: true });
    this.token = token;
    this.eventEmitter = eventEmitter;
  }

  startListenMessages() {
    this.bot.on('message', msg => {
      const chatId = msg.chat.id;
      const message = msg.text;

      this.chatList.add(chatId);

      this.eventEmitter.emit('message-from-tg', { chatId, message });
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
