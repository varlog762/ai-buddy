import c from '../constants/constants.js';

const eventListenerService = services => {
  const { eventEmitter, bot } = services;

  bot.startListenMessages();

  eventEmitter.on(events.SEND_TO_WEBSOCKET, message => {
    socket.send(message);
  });

  eventEmitter.on(events.WEBSOCKET_OPENED, () =>
    bot.sendToAll(c.WEBSOCKET_OPENED_INFO)
  );

  eventEmitter.on(events.WEBSOCKET_CLOSED, () =>
    bot.sendToAll(c.WEBSOCKET_CLOSED_INFO)
  );

  eventEmitter.on(events.WEBSOCKET_RECONNECT, () =>
    bot.sendToAll(c.WEBSOCKET_RECONNECT_INFO)
  );

  eventEmitter.on(events.UNAVAILABLE_TICKER, chatId =>
    bot.sendMessage(chatId, c.UNAVAILABLE_TICKER_WARNING)
  );

  eventEmitter.on(events.SHOW_SUBSCRIPTIONS, chatId =>
    priceSubscriptionService.showSubscriptions(chatId)
  );

  eventEmitter.on(events.SHOW_SUBSCRIPTIONS_SUCCESS, ({ chatId, message }) => {
    bot.sendMessage(chatId, message);
  });

  eventEmitter.on(events.SUBSCRIPTION_SUCCESS, tickerName => {
    priceSubscriptionService.notifySubscriptionSuccess(tickerName);
  });

  eventEmitter.on(events.ADD_SUBSCRIPTION, ticker =>
    priceSubscriptionService.subscribe(ticker)
  );

  eventEmitter.on(events.ADD_SUBSCRIPTION_SUCCESS, ({ chatId, tickerName }) =>
    bot.sendMessage(chatId, `Subscription to ${tickerName} completed!`)
  );

  eventEmitter.on(events.REMOVE_SUBSCRIPTION, ticker =>
    priceSubscriptionService.unsubscribe(ticker)
  );

  eventEmitter.on(
    events.REMOVE_SUBSCRIPTION_SUCCESS,
    ({ chatId, tickerName }) =>
      bot.sendMessage(chatId, `Subscription to ${tickerName} canceled!`)
  );
};

export default eventListenerService;
