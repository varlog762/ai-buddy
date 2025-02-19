/* eslint-disable consistent-return */
import TelegramBot from 'node-telegram-bot-api';
import {
  MESSAGES_TO_USER,
  COMMANDS,
  EVENTS,
  CHAT_ROLES,
  ERRORS,
} from '../constants/index.js';
import { ensureChatExists } from './supabase.js';
import {
  modelSelectionKeyboard,
  defaultOptionKeyboard,
  clearChatHistoryKeyboard,
} from '../utils/inline-keyboards.js';
import {
  isCommand,
  isModel,
  formatMarkdownMessageToHtml,
} from '../utils/index.js';

class TelegramBotService {
  typingIndicatorInterval = null;

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
   * Listens for incoming messages and passes them to the
   * handleMessages method for further processing.
   */
  startListenMessages() {
    this.bot.on(EVENTS.MESSAGE, msg => {
      const chatId = msg.chat.id;
      const message = msg.text;

      ensureChatExists(chatId);

      if (isCommand(message)) {
        return this.handleCommands(chatId, message);
      }

      this.handleMessages(chatId, message);
    });
  }

  /**
   * Listens for user selections via callback queries.
   * When a user selects an option, the callback query is received here.
   * The chat ID and user selection are extracted from the query.
   * The message ID of the original message that triggered the query is also extracted.
   * The message is then deleted using the deleteMessage method.
   */
  startListenUserSelection() {
    this.bot.on(EVENTS.CALLBACK_QUERY, async callbackQuery => {
      const chatId = callbackQuery?.message?.chat?.id;
      const userSelection = callbackQuery?.data;
      const messageId = callbackQuery?.message?.message_id;

      ensureChatExists(chatId);

      // Delete the original message that triggered the query
      this.deleteMessage(chatId, messageId);

      this.handleUserSelection(chatId, userSelection);
    });
  }

  async handleMessages(chatId, message) {
    if (!message) return;

    this.emit(EVENTS.MESSAGE_FROM_TG, {
      chatId,
      message,
      role: CHAT_ROLES.USER,
    });
    this.showTypingIndicator(chatId);
  }

  handleCommands(chatId, message) {
    const commands = {
      [COMMANDS.START]: () =>
        this.send({
          chatId,
          // message: TEMP_MESSAGE,
          message: MESSAGES_TO_USER.START,
          inlineKeyboard: defaultOptionKeyboard,
        }),
      [COMMANDS.CLEAR_CHAT_HISTORY]: () =>
        this.send({
          chatId,
          message: MESSAGES_TO_USER.DELETE_CHAT_HISTORY_CONFIRMATION,
          inlineKeyboard: clearChatHistoryKeyboard,
        }),
      [COMMANDS.CHANGE_MODEL]: () =>
        this.send({
          chatId,
          message: MESSAGES_TO_USER.CHOOSE_MODEL,
          inlineKeyboard: modelSelectionKeyboard,
        }),
      [COMMANDS.SHOW_MODEL]: () => this.emit(EVENTS.SHOW_CURRENT_LLM, chatId),
    };

    if (commands[message]) {
      return commands[message]();
    }
  }

  handleUserSelection(chatId, userSelection) {
    this.handleStartCommandSelection(chatId, userSelection);

    if (isModel(userSelection)) {
      return this.handleChangeModelSelection(chatId, userSelection);
    }

    if (userSelection === 'clear-history') {
      this.emit(EVENTS.CLEAR_CHAT_HISTORY, chatId);
    }
  }

  async showTypingIndicator(chatId, timer = 700) {
    if (!chatId) {
      throw new Error('chatId is required');
    }

    if (this.typingIndicatorInterval) {
      clearInterval(this.typingIndicatorInterval);
    }

    // Выполнить сразу через 700 мс
    setTimeout(async () => {
      try {
        await this.bot.sendChatAction(chatId, 'typing');
      } catch (error) {
        console.error('Typing indicator error:', error);
      }

      // Затем запускать каждую 5 сек
      this.typingIndicatorInterval = setInterval(async () => {
        try {
          await this.bot.sendChatAction(chatId, 'typing');
        } catch (error) {
          console.error('Typing indicator error:', error);
        }
      }, 5000);
    }, timer);
  }

  clearTypingIndicatorInterval() {
    if (this.typingIndicatorInterval) {
      clearInterval(this.typingIndicatorInterval);
      this.typingIndicatorInterval = null;
    }
  }

  /**
   * Sends a message to a specific chat ID.
   *
   * @param {Object} params - The parameters for sending a message.
   * @param {number} params.chatId - The ID of the chat where the message will be sent.
   * @param {string} params.message - The message to be sent.
   */
  async send({ chatId, message, inlineKeyboard = {} }) {
    const formattedMessage = formatMarkdownMessageToHtml(message);
    this.clearTypingIndicatorInterval();

    try {
      await this.bot.sendMessage(chatId, formattedMessage, {
        parse_mode: 'html',
        ...inlineKeyboard,
      });
    } catch (error) {
      await this.handleErrorSendingMessage(
        error,
        chatId,
        message,
        inlineKeyboard
      );
    }
  }

  async handleErrorSendingMessage(error, chatId, message, inlineKeyboard = {}) {
    if (error.message.includes("can't parse entities")) {
      try {
        await this.bot.sendMessage(chatId, message, {
          ...inlineKeyboard,
        });
      } catch (sendError) {
        await this.bot.sendMessage(chatId, ERRORS.SOMETHING_WRONG);
      } finally {
        console.error(error.message);
      }
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
    if (userSelection === 'change-model') {
      this.send({
        chatId,
        message: MESSAGES_TO_USER.CHOOSE_MODEL,
        inlineKeyboard: modelSelectionKeyboard,
      });
    }
  }

  async handleChangeModelSelection(chatId, userSelection) {
    const formattedSelection = formatMarkdownMessageToHtml(userSelection);
    await this.send({
      chatId,
      message: `You have selected the model: ${formattedSelection}`,
    });

    // Emit an event indicating that a model has been selected
    this.emit(EVENTS.LLM_SELECTED, { chatId, model: userSelection });
  }
}

export default TelegramBotService;
