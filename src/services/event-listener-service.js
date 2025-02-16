import { EVENTS, MESSAGES_TO_USER } from '../constants/index.js';
import {
  saveMessageToDB,
  updateLLM,
  deleteChatHistory,
  getCurrentModelName,
} from './supabase.js';

const eventListenerService = services => {
  const { eventEmitter, telegramBot, aiBot } = services;

  telegramBot.startListeners();

  /**
   * Listens for a specific event and sends the message to the given bot.
   *
   * @param {string} eventName - The name of the event to listen for.
   * @param {Object} messageSender - The bot instance to send the message to.
   */
  const startEventListener = (eventName, messageSender) => {
    eventEmitter.on(eventName, async ({ chatId, message, role }) => {
      if (!chatId || !message || !role) {
        console.error('Invalid event data:', {
          chatId,
          message,
          role,
        });

        return;
      }

      try {
        await saveMessageToDB({ chatId, message, role });
        messageSender.send({ chatId, message });
      } catch (error) {
        console.error(error);
      }
    });
  };

  startEventListener(EVENTS.MESSAGE_FROM_TG, aiBot);
  startEventListener(EVENTS.MESSAGE_FROM_AI, telegramBot);

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

export default eventListenerService;
