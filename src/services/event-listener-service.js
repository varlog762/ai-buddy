import { EVENTS } from '../constants/index.js';
import { saveMessageToDB, updateLLM, deleteChatHistory } from './supabase.js';

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
    console.log(`History cleared for chat ${chatId}`);
    deleteChatHistory(chatId);
  });

  eventEmitter.on(EVENTS.LLM_SELECTED, async ({ chatId, model }) => {
    console.log(`Selected ${model} for chat ${chatId}`);
    updateLLM(chatId, model);
  });
};

export default eventListenerService;
