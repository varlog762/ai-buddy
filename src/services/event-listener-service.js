import { MESSAGE_FROM_AI, MESSAGE_FROM_TG } from '../constants/index.js';

const eventListenerService = services => {
  const { eventEmitter, telegramBot, aiBot } = services;

  telegramBot.startListenMessages();

  /**
   * Listens for a specific event and sends the message to the given bot.
   *
   * @param {string} event - The name of the event to listen for.
   * @param {Object} bot - The bot instance to send the message to.
   */
  const startListener = (event, bot) => {
    eventEmitter.on(event, ({ chatId, message }) => {
      bot.send({ chatId, message });
    });
  };

  startListener(MESSAGE_FROM_TG, aiBot);
  startListener(MESSAGE_FROM_AI, telegramBot);
};

export default eventListenerService;
