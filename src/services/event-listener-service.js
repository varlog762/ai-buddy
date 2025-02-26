import { EVENTS, MESSAGES_TO_USER } from '../constants/index.js';
import {
  saveMessageToDB,
  updateLLM,
  deleteChatHistory,
  getCurrentModelName,
} from './supabase.js';
import {
  handleLongText,
  getVoiceMessageFromTelegram,
  convertBlobToBuffer,
  saveFileStream,
  createFileName,
} from '../utils/index.js';

const handleTelegramTextMessage = async (aiBot, eventData) => {
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

const handleAIMessage = async (telegramBot, eventData) => {
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
    handleTelegramTextMessage(aiBot, eventData)
  );

  eventEmitter.on(EVENTS.VOICE_MESSAGE_FROM_TG, async eventData => {
    const {
      chatId,
      payload: { voiceMessageFileId, voiceMessageFileUniqueId },
      role,
    } = eventData || {};

    if (!chatId || !voiceMessageFileId || !role) {
      console.error(
        `Invalid event data for ${EVENTS.VOICE_MESSAGE_FROM_TG}:`,
        eventData
      );
      return;
    }

    try {
      const blob = await getVoiceMessageFromTelegram(voiceMessageFileId);
      const buffer = await convertBlobToBuffer(blob);

      const fileName = createFileName(chatId, voiceMessageFileUniqueId, 'ogg');
      await saveFileStream(buffer, fileName);
    } catch (error) {
      console.error(error);
    }
  });

  eventEmitter.on(EVENTS.MESSAGE_FROM_AI, eventData =>
    handleAIMessage(telegramBot, eventData)
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
