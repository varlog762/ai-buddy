/* eslint-disable consistent-return */
import TelegramBot from 'node-telegram-bot-api';
import {
  MESSAGE,
  MESSAGE_FROM_TG,
  LLM_SELECTED,
  USER_ROLE,
  SOMETHING_WENT_WRONG,
  CLEAR_CHAT_HISTORY,
  STARTING_MESSAGE,
  CHOOSE_MODEL_MESSAGE,
} from '../constants/index.js';
import { ensureChatExists } from './supabase.js';
import {
  modelSelectionKeyboard,
  defaultOptionKeyboard,
} from '../utils/inline-keyboards.js';

class TelegramBotService {
  constructor(token, eventEmitter) {
    this.bot = new TelegramBot(token, { polling: true });
    this.eventEmitter = eventEmitter;
  }

  /**
   * Initializes the bot listeners for handling incoming messages
   * and user selections from callback queries.
   */
  startListeners() {
    // Start listening for regular messages
    this.startListenMessages();

    // Start listening for user selections via callback queries
    this.startListenUserSelection();
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

  startListenUserSelection() {
    this.bot.on('callback_query', async callbackQuery => {
      const chatId = callbackQuery?.message?.chat?.id;
      const userSelection = callbackQuery?.data;
      const messageId = callbackQuery?.message?.message_id;

      this.deleteMessage(chatId, messageId);
    });
  }

  async handleMessages(chatId, message) {
    if (!message) return;

    ensureChatExists(chatId);

    const commands = {
      '/start': () =>
        this.send({
          chatId,
          message: STARTING_MESSAGE,
          inlineKeyboard: modelSelectionKeyboard,
        }),
      '/clear': () => this.emit(CLEAR_CHAT_HISTORY, chatId),
      '/change-model': () => this.handleChangeModelCommand(chatId),
    };

    if (commands[message]) {
      return commands[message]();
    }

    this.emit(MESSAGE_FROM_TG, { chatId, message, role: USER_ROLE });

    this.showTypingIndicator(chatId);
  }

  async showTypingIndicator(chatId, timer = 700) {
    setTimeout(async () => {
      try {
        await this.bot.sendChatAction(chatId, 'typing');
      } catch (error) {
        console.error('Typing indicator error:', error);
      }
    }, timer);
  }

  /**
   * Sends a message to a specific chat ID.
   *
   * @param {Object} params - The parameters for sending a message.
   * @param {number} params.chatId - The ID of the chat where the message will be sent.
   * @param {string} params.message - The message to be sent.
   */
  async send({ chatId, message, inlineKeyboard = {} }) {
    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...inlineKeyboard,
      });
    } catch (error) {
      await this.bot.sendMessage(chatId, SOMETHING_WENT_WRONG);
      console.error(error);
    }
  }

  /**
   * Emits an event on the event emitter with the given payload.
   *
   * @param {string} event - The name of the event to emit.
   * @param {Object} payload - The payload to be sent with the event.
   */
  emit(event, payload) {
    this.eventEmitter.emit(event, payload);
  }

  /**
   * Deletes a message from a chat.
   *
   * @param {number} chatId - The ID of the chat where the message was sent.
   * @param {number} messageId - The ID of the message to be deleted.
   */
  async deleteMessage(chatId, messageId) {
    try {
      if (!messageId) return;
      // Attempt to delete the message
      await this.bot.deleteMessage(chatId, messageId);
    } catch (error) {
      // Log the error if the message deletion fails
      console.error('Failed to delete message:', error.message);
    }
  }

  async handleStartCommandSelection(chatId, userSelection) {
    console.log('i am here');
    console.log(chatId, userSelection);
    if (!chatId || !userSelection || userSelection === 'keep-default') {
      this.removeCallbackQueryListener();
      return;
    }

    console.log(await this.callbackQueryListener());
  }

  async handleChangeModelSelection(chatId, userSelection) {
    console.log('i am too:', chatId, userSelection);
    // Send confirmation message to the user
    await this.send({
      chatId,
      message: `You have selected the model: ${userSelection}`,
    });

    // Emit an event indicating that a model has been selected
    this.emit(LLM_SELECTED, { chatId, userSelection });
  }
}

export default TelegramBotService;
