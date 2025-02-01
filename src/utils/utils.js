

export const stringifyCommandMessages = messageObject =>
  Object.entries(messageObject)
    .map(item => `${item[0]} - ${item[1]}`)
    .join('\n');

export const createEmitPayload = (chatId, tickerName, originalPrice) => ({
  chatId,
  tickerName,
  originalPrice,
});
