import OpenAI from 'openai';
import { MESSAGE_FROM_AI, USER_ROLE } from '../constants/index.js';

class AIChatService {
  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send(message) {
    try {
      const completion = await this.bot.chat.completions.create({
        model: 'meta-llama/llama-3.1-70b-instruct:free',
        messages: [
          {
            role: USER_ROLE,
            content: message,
          },
        ],
      });

      const responseMessage = completion?.choices[0]?.message?.content;

      if (!responseMessage) {
        this.eventEmitter.emit(MESSAGE_FROM_AI, completion);
        console.log(completion);
      }

      this.eventEmitter.emit(MESSAGE_FROM_AI, responseMessage);
    } catch (error) {
      console.error(error);
    }
  }
}

export default AIChatService;
