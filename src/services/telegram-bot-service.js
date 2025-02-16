/* eslint-disable consistent-return */
import TelegramBot from 'node-telegram-bot-api';
import {
  USER_ROLE,
  SOMETHING_WENT_WRONG,
  CLEAR_CHAT_HISTORY,
  STARTING_MESSAGE,
  CHOOSE_MODEL_MESSAGE,
  COMMANDS,
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
   * Listens for incoming messages and passes them to the
   * handleMessages method for further processing.
   */
  startListenMessages() {
    this.bot.on(MESSAGE, msg => {
      const chatId = msg.chat.id;
      const message = msg.text;

      ensureChatExists(chatId);

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
    this.bot.on(CALLBACK_QUERY, async callbackQuery => {
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

    const isMessageCommand = this.handleCommands(chatId, message);

    if (!isMessageCommand) {
      this.emit(MESSAGE_FROM_TG, { chatId, message, role: USER_ROLE });
      this.showTypingIndicator(chatId);
    }
  }

  handleCommands(chatId, message) {
    const commands = {
      [COMMANDS.START]: () =>
        this.send({
          chatId,
          message: STARTING_MESSAGE,
          inlineKeyboard: defaultOptionKeyboard,
        }),
      [COMMANDS.CLEAR]: () => this.emit(CLEAR_CHAT_HISTORY, chatId),
      [COMMANDS.CHANGE_MODEL]: () => this.handleChangeModelCommand(chatId),
      [COMMANDS.SHOW_MODEL]: () => console.log('show model'),
    };

    if (commands[message]) {
      return commands[message]();
    }

    return false;
  }

  handleUserSelection(chatId, userSelection) {}

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
    if (!chatId || !userSelection || userSelection === 'change-model') {
      this.send({
        chatId,
        message: CHOOSE_MODEL_MESSAGE,
        inlineKeyboard: modelSelectionKeyboard,
      });
    }
  }

  async handleChangeModelSelection(chatId, userSelection) {
    await this.send({
      chatId,
      message: `You have selected the model: ${userSelection}`,
    });

    // Emit an event indicating that a model has been selected
    this.emit(LLM_SELECTED, { chatId, userSelection });
  }
}

export default TelegramBotService;
