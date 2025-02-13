import TelegramBot from 'node-telegram-bot-api';
import {
  MESSAGE,
  MESSAGE_FROM_TG,
  LLM_SELECTED,
  USER_ROLE,
  SOMETHING_WENT_WRONG,
  CLEAR_CHAT_HISTORY,
  LLAMA,
  DEEPSEEK,
  GEMINI,
} from '../constants/index.js';

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

  /**
   * Starts listening for model selection via callback queries.
   *
   * Ensures that any existing listener is removed before adding a new one.
   * When a model is selected, it sends a confirmation message, deletes the original message,
   * and emits an event indicating the model selection.
   */
  startListeningForModelSelection() {
    // Remove the existing callback query listener if it exists
    if (this.callbackQueryListener) {
      this.bot.removeListener('callback_query', this.callbackQueryListener);
    }

    // Define the callback query listener
    this.callbackQueryListener = async callbackQuery => {
      const chatId = callbackQuery.message.chat.id;
      const model = callbackQuery.data;

      // Send confirmation message to the user
      await this.send({
        chatId,
        message: `You have selected the model: ${model}`,
      });

      // Delete the original message with the model selection options
      await this.bot.deleteMessage(chatId, callbackQuery.message.message_id);

      // Emit an event indicating that a model has been selected
      this.emit(LLM_SELECTED, { chatId, model });

      // Remove the listener after handling the callback query
      this.bot.removeListener('callback_query', this.callbackQueryListener);
      this.callbackQueryListener = null;
    };

    // Add the new callback query listener
    this.bot.on('callback_query', this.callbackQueryListener);
  }
}

export default TelegramBotService;
