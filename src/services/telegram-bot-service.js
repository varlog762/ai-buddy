import TelegramBot from 'node-telegram-bot-api';
import {
  MESSAGE,
  MESSAGE_FROM_TG,
  USER_ROLE,
  SOMETHING_WENT_WRONG,
  CLEAR_CHAT_HISTORY,
  LLAMA,
  DEEPSEEK,
  GEMINI,
} from '../constants/index.js';
// import { splitMessageForTelegram } from '../utils/index.js';

class TelegramBotService {
  constructor(token, eventEmitter) {
    this.bot = new TelegramBot(token, { polling: true });
    this.eventEmitter = eventEmitter;
    this.callbackQueryListener = null;
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

      this.handleMessages(chatId, message);
    });
  }

  // eslint-disable-next-line consistent-return
  handleMessages(chatId, message) {
    if (message === '/start') {
      return this.handleStartCommand(chatId);
    }

    if (message === '/clear') {
      return this.emit(CLEAR_CHAT_HISTORY, chatId);
    }

    if (message === '/change-model') {
      return this.handleChangeModelCommand(chatId);
    }

    this.emit(MESSAGE_FROM_TG, { chatId, message, role: USER_ROLE });
    setTimeout(() => this.bot.sendChatAction(chatId, 'typing'), 700);
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
    } catch (error) {
      await this.bot.sendMessage(chatId, SOMETHING_WENT_WRONG);
      console.error(error);
    }
  }

  emit(event, payload) {
    this.eventEmitter.emit(event, payload);
  }

  async handleStartCommand(chatId) {
    const message = 'Привет! Выберите модель LLM:';

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔵 Llama 3.1 70b', callback_data: LLAMA }],
          [{ text: '🟢 Gemini 2.0', callback_data: GEMINI }],
          [{ text: '🟡 DeepSeek R1', callback_data: DEEPSEEK }],
        ],
      },
    };

    await this.bot.sendMessage(chatId, message, keyboard);

    this.startListeningForModelSelection();
  }

  startListeningForModelSelection() {
    if (this.callbackQueryListener) {
      this.bot.removeListener('callback_query', this.callbackQueryListener);
    }

    this.callbackQueryListener = async query => {
      const chatId = query.message.chat.id;
      const selectedModel = query.data;

      await this.bot.sendMessage(chatId, `Вы выбрали модель: ${selectedModel}`);

      await this.bot.deleteMessage(chatId, query.message.message_id);

      // Вызываем событие для сохранения модели
      // this.emit('LLM_SELECTED', { chatId, model: selectedModel });

      // Удаляем слушатель, чтобы не ловить старые callback_query
      this.bot.removeListener('callback_query', this.callbackQueryListener);
      this.callbackQueryListener = null;
    };

    this.bot.on('callback_query', this.callbackQueryListener);
  }
}

export default TelegramBotService;
