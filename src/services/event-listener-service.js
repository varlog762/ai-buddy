import { EVENTS, MESSAGES_TO_USER, EXTENSIONS } from '../constants/index.js';
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

const handleTextMessageFromTelegram = async (aiBot, eventData) => {
  const { chatId, payload: message, role } = eventData || {};

  if (!chatId || !message || !role) {
    console.error(
      `Invalid event data for ${EVENTS.MESSAGE_FROM_TG}:`,
      eventData
    );
    return;
  }

  try {
    await saveMessageToDB({ chatId, message, role });
    await aiBot.send({ chatId, message });
  } catch (error) {
    console.error(`Error handling event ${EVENTS.MESSAGE_FROM_TG}:`, error);
  }
};

const handleMessageFromLLM = async (telegramBot, eventData) => {
  const { chatId, message, role } = eventData || {};

  if (!chatId || !message || !role) {
    console.error(
      `Invalid event data for ${EVENTS.MESSAGE_FROM_AI}:`,
      eventData
    );
    return;
  }

  try {
    await saveMessageToDB({ chatId, message, role });

    const messageChunks = handleLongText(message);

    for (const chunk of messageChunks) {
      await telegramBot.send({ chatId, message: chunk });
    }
  } catch (error) {
    console.error(`Error handling event ${EVENTS.MESSAGE_FROM_AI}:`, error);
  }
};

export const startEventListeners = services => {
  const { eventEmitter, telegramBot, aiBot } = services;

  telegramBot.startListeners();

  eventEmitter.on(EVENTS.MESSAGE_FROM_TG, eventData =>
    handleTextMessageFromTelegram(aiBot, eventData)
  );

  eventEmitter.on(EVENTS.VOICE_MESSAGE_FROM_TG, async eventData => {
    const { chatId, payload: fileId, role } = eventData || {};
    if (!chatId || !fileId || !role) {
      console.error(
        `Invalid event data for ${EVENTS.VOICE_MESSAGE_FROM_TG}:`,
        eventData
      );
      return;
    }

    eventEmitter.emit(EVENTS.)

    try {
      const buffer = await getBufferFromTelegramVoiceMessage(fileId);

      const fileName = createFileName(chatId, EXTENSIONS.OGG);
      const filePath = getAbsoluteFilePath('audio', fileName);
      await saveFileStream(buffer, fileName);
      await convertOggToWav(filePath);
    } catch (error) {
      console.error(error);
    }
  });

  eventEmitter.on(EVENTS.MESSAGE_FROM_AI, eventData =>
    handleMessageFromLLM(telegramBot, eventData)
  );

  eventEmitter.on(EVENTS.CLEAR_CHAT_HISTORY, async chatId => {
    deleteChatHistory(chatId);
  });

  eventEmitter.on(EVENTS.LLM_SELECTED, async ({ chatId, model }) => {
    console.log(`Selected ${model} for chat ${chatId}`);
    updateLLM(chatId, model);
  });

  eventEmitter.on(EVENTS.SHOW_CURRENT_LLM, async chatId => {
    const model = await getCurrentModelName(chatId);

    telegramBot.send({
      chatId,
      message: `${MESSAGES_TO_USER.SHOW_MODEL} ${model}`,
    });
  });
};
