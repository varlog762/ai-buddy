const eventListenerService = services => {
  const { eventEmitter, tgBot } = services;

  tgBot.startListenMessages();

  eventEmitter.on('message-from-tg', ({ chatId, message }) => {
    console.log(chatId, message);
  });
};

export default eventListenerService;
