import TelegramBot from 'node-telegram-bot-api';

class TelegramBotService {
  bot = null;

  chatList = new Set();

  constructor(token, eventEmitter) {
    this.token = token;
    this.eventEmitter = eventEmitter;
  }

  start() {
    this.bot = new TelegramBot(this.token, { polling: true });
  }

  startListenMessages() {
    this.bot.on('message', msg => {
      const chatId = msg.chat.id;
      this.chatList.add(chatId);

      const splittedMessageText = msg.text.split(' ');
      const command = splittedMessageText[0];

      const tickerName = splittedMessageText[1]
        ? splittedMessageText[1].toUpperCase()
        : '';

      const originalPrice = splittedMessageText[2]
        ? parseFloat(splittedMessageText[2].replace(',', '.'))
        : null;

      this.commandHandler(chatId, command, tickerName, originalPrice);
    });
  }

  sendToAll(message) {
    this.chatsList.forEach(chatId => this.bot.sendMessage(chatId, message));
  }

  sendMessage(chatId, message) {
    this.bot.sendMessage(chatId, message);
  }
}

export default TelegramBotService;
