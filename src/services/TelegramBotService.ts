/* eslint-disable consistent-return */
import TelegramBot from 'node-telegram-bot-api';
import {
  SystemMessages,
  ChatCommands,
  Events,
  ChatRoles,
  ErrorMessages,
  Formats,
} from '../enums/index';
import { inlineKeyboards } from '../constants/inline-keyboards.js';
import { ensureChatExists } from './supabase.js';
import {
  isCommand,
  isModel,
  formatMarkdownMessageToHtml,
} from '../utils/index.js';
import EventEmitter from 'node:events';

class TelegramBotService {
  typingIndicatorTimer: Timeout | null = null;
  bot: TelegramBot;
  eventEmitter: EventEmitter;

  constructor(token: string, eventEmitter: EventEmitter) {
    this.bot = new TelegramBot(token, { polling: true });
    this.eventEmitter = eventEmitter;
  }

  /**
   * Initializes the bot listeners for handling incoming messages
   * and user selections from callback queries.
   */
  startListeners(): void {
    // Start listening for regular messages
    this.startListenMessages();

    // Start listening for user selections via callback queries
    this.startListenUserSelection();
  }

  /**
   * Listens for incoming messages and passes them to the
   * handleMessages method for further processing.
   */
  startListenMessages(): void {
    this.bot.on(Events.MESSAGE, msg => this.handleMessages(msg));
  }

  handleMessages(msg: TelegramBot.Message) {
    const chatId = msg.chat?.id;
    const message = msg.text;
    const voiceMessageFileId = msg.voice?.file_id;

    ensureChatExists(chatId);

    if (voiceMessageFileId) {
      return this.handleMessage(
        chatId,
        voiceMessageFileId,
        Events.VOICE_MESSAGE_FROM_TG
      );
    }

    if (message) {
      return isCommand(message)
        ? this.handleCommands(chatId, message)
        : this.handleMessage(chatId, message);
    }
  }

  /**
   * Listens for user selections via callback queries.
   * When a user selects an option, the callback query is received here.
   * The chat ID and user selection are extracted from the query.
   * The message ID of the original message that triggered the query is also extracted.
   * The message is then deleted using the deleteMessage method.
   */
  startListenUserSelection() {
    this.bot.on(Events.CALLBACK_QUERY, async callbackQuery => {
      const chatId = callbackQuery.message?.chat?.id;
      const userSelection = callbackQuery.data;
      const messageId = callbackQuery.message?.message_id;

      ensureChatExists(chatId);

      // Delete the original message that triggered the query
      this.deleteMessage(chatId, messageId);

      this.handleUserSelection(chatId, userSelection);
    });
  }

  async handleMessage(
    chatId: string | number,
    payload: string,
    event = Events.MESSAGE_FROM_TG
  ) {
    if (!payload) return;

    this.emit(event, { chatId, payload, role: ChatRoles.USER });
    this.startTypingIndicator(chatId);
  }

  handleCommands(chatId: number, message: string) {
    const commands = {
      [ChatCommands.START]: () =>
        this.send({
          chatId,
          message: SystemMessages.START,
          inlineKeyboard: inlineKeyboards.defaultOption,
        }),
      [ChatCommands.CLEAR_CHAT_HISTORY]: () =>
        this.send({
          chatId,
          message: SystemMessages.DELETE_CHAT_HISTORY_CONFIRMATION,
          inlineKeyboard: inlineKeyboards.clearChatHistory,
        }),
      [ChatCommands.CHANGE_MODEL]: () =>
        this.send({
          chatId,
          message: SystemMessages.CHOOSE_MODEL,
          inlineKeyboard: inlineKeyboards.modelSelection,
        }),
      [ChatCommands.SHOW_MODEL]: () =>
        this.emit(Events.SHOW_CURRENT_LLM, chatId),
    };

    if (commands[message]) {
      return commands[message]();
    }
  }

  handleUserSelection(chatId: string, userSelection: string) {
    this.handleStartCommandSelection(chatId, userSelection);

    if (isModel(userSelection)) {
      return this.handleChangeModelSelection(chatId, userSelection);
    }

    if (userSelection === 'clear-history') {
      this.emit(Events.CLEAR_CHAT_HISTORY, chatId);
    }
  }

  /**
   * Sends a message to a specified chat.
   *
   * This method stops the typing indicator before sending the message.
   * It attempts to send the message with HTML formatting and an optional inline keyboard.
   * If an error occurs, it calls `handleErrorSendingMessage` to handle the failure.
   *
   * @param {Object} options - The message options.
   * @param {number} options.chatId - The ID of the chat where the message should be sent.
   * @param {string} options.message - The message text to send.
   * @param {Object} [options.inlineKeyboard={}] - Optional inline keyboard buttons.
   * @returns {Promise<void>} A promise that resolves when the message is sent.
   */
  async send({ chatId, message, inlineKeyboard = {} }) {
    this.stopTypingIndicator();

    try {
      // const formattedMessage = formatMarkdownMessageToHtml(message);
      return await this.bot.sendMessage(chatId, message, {
        parse_mode: Formats.HTML,
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

  // TODO: refactor handleErrorSendingMessage
  async handleErrorSendingMessage(
    error: unknown,
    chatId: TelegramBot.ChatId,
    message: string,
    inlineKeyboard = {}
  ) {
    if (error.message.includes("can't parse entities")) {
      try {
        await this.bot.sendMessage(chatId, message, { ...inlineKeyboard });
      } catch (sendError) {
        await this.bot.sendMessage(chatId, ErrorMessages.SOMETHING_WRONG);
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
  emit(event: Events, payload: string) {
    this.eventEmitter.emit(event, payload);
  }

  /**
   * Deletes a message from a chat.
   *
   * @param {number} chatId - The ID of the chat where the message was sent.
   * @param {number} messageId - The ID of the message to be deleted.
   */
  async deleteMessage(chatId: string, messageId: number): Promise<void> {
    try {
      if (!messageId) return;
      // Attempt to delete the message
      await this.bot.deleteMessage(chatId, messageId);
    } catch (error) {
      // Log the error if the message deletion fails
      console.error('Failed to delete message:', error.message);
    }
  }

  /**
   * Sends a typing indicator to a specific chat ID.
   * If the `timer` option is specified, it will start the typing indicator after the specified time.
   * The typing indicator will keep sending every 5 seconds until the `stopTypingIndicator` method is called.
   * @param {string} chatId
   * @param {number} [timer=700] - time in milliseconds to start the typing indicator
   */
  async startTypingIndicator(chatId: string, timer: number = 700) {
    const action = 'typing';

    if (!chatId) {
      return console.error('startTypingIndicator: chatId is required');
    }

    // If the typing indicator is already running, stop it
    if (this.typingIndicatorTimer) {
      clearInterval(this.typingIndicatorTimer);
    }

    // Wait for the specified time before starting the typing indicator
    setTimeout(async () => {
      await this.sendChatAction(chatId, action);
      // Start the typing indicator and keep sending every 5 seconds
      this.typingIndicatorTimer = setInterval(async () => {
        await this.sendChatAction(chatId, action);
      }, 7000);
    }, timer);
  }

  /**
   * Sends a chat action (e.g., typing indicator) to a specific chat ID.
   *
   * @param {string} chatId - The ID of the chat where the action will be sent.
   * @param {string} action - The action to be performed (e.g., 'typing').
   */
  async sendChatAction(chatId: TelegramBot.ChatId, action: string) {
    try {
      // Attempt to send the specified chat action to the given chat ID
      await this.bot.sendChatAction(chatId, action);
    } catch (error) {
      // Log an error message if the chat action fails
      console.error('Typing indicator error:', error);
    }
  }

  /**
   * Stops the typing indicator from running.
   * If the typing indicator is running, calling this method will stop it.
   */
  stopTypingIndicator() {
    if (this.typingIndicatorTimer) {
      // Clear the timer for the typing indicator
      clearInterval(this.typingIndicatorTimer);

      // Reset the timer to null
      this.typingIndicatorTimer = null;
    }
  }

  async handleStartCommandSelection(chatId: string, userSelection: string) {
    if (userSelection === 'change-model') {
      this.send({
        chatId,
        message: SystemMessages.CHOOSE_MODEL,
        inlineKeyboard: inlineKeyboards.modelSelection,
      });
    }
  }

  async handleChangeModelSelection(
    chatId: string,
    userSelection: string | undefined
  ) {
    const formattedSelection = formatMarkdownMessageToHtml(userSelection);
    await this.send({
      chatId,
      message: `You have selected the model: ${formattedSelection}`,
    });

    // Emit an event indicating that a model has been selected
    this.emit(Events.LLM_SELECTED, { chatId, model: userSelection });
  }
}

export default TelegramBotService;
