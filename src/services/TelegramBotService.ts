import TelegramBot, { ChatAction } from 'node-telegram-bot-api';
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
import { TelegramSendMessageOptions } from '../types/telegram-send-method.options';

class TelegramBotService {
  typingIndicatorTimer: NodeJS.Timeout | null = null;
  bot: TelegramBot;
  eventEmitter: EventEmitter;

  constructor(token: string, eventEmitter: EventEmitter) {
    this.bot = new TelegramBot(token, { polling: true });
    this.eventEmitter = eventEmitter;
  }

  startListeners(): void {
    this.startListenMessages();

    this.startListenUserSelection();
  }

  startListenMessages(): void {
    this.bot.on(Events.MESSAGE, msg => this.handleMessages(msg));
  }

  handleMessages(msg: TelegramBot.Message) {
    const chatId: number | undefined = msg.chat?.id;
    const message: string | ChatCommands | undefined = msg.text;
    const voiceMessageFileId = msg.voice?.file_id;

    if (!chatId) return;

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
        ? this.handleCommands(chatId, message as ChatCommands)
        : this.handleMessage(chatId, message);
    }
  }

  startListenUserSelection() {
    this.bot.on(Events.CALLBACK_QUERY, async callbackQuery => {
      const chatId: number | undefined = callbackQuery.message?.chat?.id;
      const userSelection = callbackQuery.data;
      const messageId = callbackQuery.message?.message_id;

      if (!chatId) return;

      ensureChatExists(chatId);

      this.deleteMessage(chatId, messageId);

      this.handleUserSelection(chatId, userSelection);
    });
  }

  async handleMessage(
    chatId: number,
    payload: string,
    event = Events.MESSAGE_FROM_TG
  ) {
    if (!payload) return;

    this.emit(event, { chatId, payload, role: ChatRoles.USER });
    this.startTypingIndicator(chatId);
  }

  handleCommands(chatId: number, message: ChatCommands) {
    const commandActions: Record<ChatCommands, () => void> = {
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

    commandActions[message]?.();
  }

  handleUserSelection(chatId: number, userSelection: string | undefined) {
    if (!userSelection) return;

    this.handleStartCommandSelection(chatId, userSelection);

    if (isModel(userSelection)) {
      return this.handleChangeModelSelection(chatId, userSelection);
    }

    if (userSelection === 'clear-history') {
      this.emit(Events.CLEAR_CHAT_HISTORY, chatId);
    }
  }

  async send({
    chatId,
    message,
    inlineKeyboard = {},
  }: TelegramSendMessageOptions) {
    this.stopTypingIndicator();

    try {
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

  async handleErrorSendingMessage(
    error: unknown,
    chatId: TelegramBot.ChatId,
    message: string,
    inlineKeyboard = {}
  ) {
    console.error('Error sending message:', (error as Error).message);

    if ((error as Error).message.includes("can't parse entities")) {
      try {
        await this.bot.sendMessage(chatId, message, { ...inlineKeyboard });
      } catch {
        await this.bot.sendMessage(chatId, ErrorMessages.SOMETHING_WRONG);
      }
    }
  }

  emit(event: Events, payload: any) {
    this.eventEmitter.emit(event, payload);
  }

  async deleteMessage(
    chatId: number,
    messageId: number | undefined
  ): Promise<void> {
    try {
      if (!messageId) return;
      await this.bot.deleteMessage(chatId, messageId);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to delete message:', error.message);
      } else {
        console.error('Unknown error occurred:', error);
      }
    }
  }

  async startTypingIndicator(chatId: number, timer = 700) {
    if (this.typingIndicatorTimer) {
      clearInterval(this.typingIndicatorTimer);
    }

    setTimeout(() => {
      this.sendChatAction(chatId, 'typing');
      this.typingIndicatorTimer = setInterval(() => {
        this.sendChatAction(chatId, 'typing');
      }, 7000);
    }, timer);
  }

  async sendChatAction(chatId: TelegramBot.ChatId, action: ChatAction) {
    try {
      await this.bot.sendChatAction(chatId, action);
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  }

  stopTypingIndicator() {
    if (this.typingIndicatorTimer) {
      clearInterval(this.typingIndicatorTimer);

      this.typingIndicatorTimer = null;
    }
  }

  async handleStartCommandSelection(chatId: number, userSelection: string) {
    if (userSelection === 'change-model') {
      this.send({
        chatId,
        message: SystemMessages.CHOOSE_MODEL,
        inlineKeyboard: inlineKeyboards.modelSelection,
      });
    }
  }

  async handleChangeModelSelection(
    chatId: number,
    userSelection: string | undefined
  ) {
    const formattedSelection = formatMarkdownMessageToHtml(userSelection);
    await this.send({
      chatId,
      message: `You have selected the model: ${formattedSelection}`,
    });

    this.emit(Events.LLM_SELECTED, { chatId, model: userSelection });
  }
}

export default TelegramBotService;
