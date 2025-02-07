import 'dotenv/config';
import { EventEmitter } from 'node:events';

import TelegramBotService from './services/telegram-bot-service.js';
import AIChatService from './services/ai-chat-service.js';
import eventListenerService from './services/event-listener-service.js';

const { TELEGRAM_API_TOKEN, AI_API_KEY, AI_API_URL } = process.env;

const startApp = async () => {
  const eventEmitter = new EventEmitter();

  const telegramBot = new TelegramBotService(TELEGRAM_API_TOKEN, eventEmitter);

  const aiBot = new AIChatService(AI_API_URL, AI_API_KEY);
  await aiBot.send();

  const services = { eventEmitter, telegramBot };

  // eventListenerService(services);
};

startApp();
