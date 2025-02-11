import { MESSAGE_FROM_AI, MESSAGE_FROM_TG } from '../constants/index.js';
import { saveMessageToDB } from './supabase.js';

const eventListenerService = services => {
  const { eventEmitter, telegramBot, aiBot } = services;

  telegramBot.startListenMessages();

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

  startEventListener(MESSAGE_FROM_TG, aiBot);
  startEventListener(MESSAGE_FROM_AI, telegramBot);
};

export default eventListenerService;
