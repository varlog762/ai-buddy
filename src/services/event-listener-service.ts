import { Events, SystemMessages, Formats, AiModels } from '../enums';
import {
  saveMessageToDB,
  updateLLM,
  deleteChatHistory,
  getCurrentModelName,
} from './supabase.js';
import { handleLongText } from '../utils/index.js';
import { getBufferFromTelegramVoiceMessage } from '../utils/telegram-file.js';
import {
  saveFileStream,
  createFileName,
  getAbsoluteFilePath,
} from '../utils/file-utils.js';
import { convertOggToWav } from './media-converter.js';
import AIChatService from './AiChatService';
import TelegramBotService from './TelegramBotService';

const handleTextMessageFromTelegram = async (
  aiBot: AIChatService,
  eventData
) => {
  const { chatId, payload: message, role } = eventData || {};

  if (!chatId || !message || !role) {
    console.error(
      `Invalid event data for ${Events.MESSAGE_FROM_TG}:`,
      eventData
    );
    return;
  }

  try {
    await saveMessageToDB({ chatId, message, role });
    await aiBot.send(chatId);
  } catch (error) {
    console.error(`Error handling event ${Events.MESSAGE_FROM_TG}:`, error);
  }
};

const handleMessageFromLLM = async (
  telegramBot: TelegramBotService,
  eventData
) => {
  const { chatId, message, role } = eventData || {};

  if (!chatId || !message || !role) {
    console.error(`Invalid event data for ${Events.MESSAGE_TO_TG}:`, eventData);
    return;
  }

  try {
    await saveMessageToDB({ chatId, message, role });

    const messageChunks = handleLongText(message);

    for (const chunk of messageChunks) {
      await telegramBot.send({ chatId, message: chunk });
    }
  } catch (error) {
    console.error(`Error handling event ${Events.MESSAGE_TO_TG}:`, error);
  }
};

export const startEventListeners = services => {
  const { eventEmitter, telegramBot, aiBot } = services;

  telegramBot.startListeners();

  eventEmitter.on(Events.MESSAGE_FROM_TG, eventData =>
    handleTextMessageFromTelegram(aiBot, eventData)
  );

  eventEmitter.on(Events.VOICE_MESSAGE_FROM_TG, async eventData => {
    const { chatId, payload: fileId, role } = eventData || {};
    if (!chatId || !fileId || !role) {
      console.error(
        `Invalid event data for ${Events.VOICE_MESSAGE_FROM_TG}:`,
        eventData
      );
      return;
    }

    const message = await telegramBot.send({
      chatId,
      message: 'Your voice message is being processed, please wait...',
    });

    const messageId = message.message_id;

    setTimeout(() => telegramBot.deleteMessage(chatId, messageId), 1000);

    try {
      const buffer = await getBufferFromTelegramVoiceMessage(fileId);

      const fileName = createFileName(chatId, Formats.OGG);
      const filePath = getAbsoluteFilePath('audio', fileName);
      await saveFileStream(buffer, fileName);
      await convertOggToWav(filePath);

      // const answer = fetch();
    } catch (error) {
      console.error(error);
    }
  });

  eventEmitter.on(Events.MESSAGE_TO_TG, eventData =>
    handleMessageFromLLM(telegramBot, eventData)
  );

  eventEmitter.on(Events.CLEAR_CHAT_HISTORY, async (chatId: number) => {
    deleteChatHistory(chatId);
  });

  eventEmitter.on(
    Events.LLM_SELECTED,
    async ({ chatId, model }: { chatId: number; model: AiModels }) => {
      console.log(`Selected ${model} for chat ${chatId}`);
      updateLLM(chatId, model);
    }
  );

  eventEmitter.on(Events.SHOW_CURRENT_LLM, async (chatId: string) => {
    const model = await getCurrentModelName(chatId);

    telegramBot.send({
      chatId,
      message: `${SystemMessages.SHOW_MODEL} ${model}`,
    });
  });
};
