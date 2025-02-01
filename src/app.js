import 'dotenv/config';
import { EventEmitter } from 'node:events';

import TelegramBotService from './services/telegram-bot-service.js';
import eventListenerService from './services/event-listener-service.js';

const { TELEGRAM_TOKEN } = process.env;

const startApp = async () => {
  const eventEmitter = new EventEmitter();

  const bot = new TelegramBotService(TELEGRAM_TOKEN, eventEmitter);
  bot.start();

  const services = { eventEmitter, bot };

  eventListenerService(services);
};

startApp();
