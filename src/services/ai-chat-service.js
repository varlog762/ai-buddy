import OpenAI from 'openai';
import {
  MESSAGE_FROM_AI,
  USER_ROLE,
  GEMINI,
  DEEPSEEK,
  LLAMA,
} from '../constants/index.js';

class AIChatService {
  models = [DEEPSEEK, LLAMA, GEMINI];

  currentModelIdx = 0;

  constructor(baseURL, apiKey, eventEmitter) {
    this.bot = new OpenAI({ baseURL, apiKey });
    this.eventEmitter = eventEmitter;
  }

  async send({ chatId, message }) {
    try {
      const completion = await this.bot.chat.completions.create({
        model: this.models[this.currentModelIdx],
        messages: [
          {
            role: USER_ROLE,
            content: message,
          },
        ],
      });

      const responseMessage = completion?.choices[0]?.message?.content;

      this.eventEmitter.emit(MESSAGE_FROM_AI, {
        chatId,
        message: responseMessage,
      });
    } catch (error) {
      this.eventEmitter.emit(MESSAGE_FROM_AI, {
        chatId,
        message: 'Oops! Something went wrong. Try again later.',
      });

      console.error(error);

      // this.modelIdx += 1;

      // this.send({ chatId, message });
    }
  }
}

export default AIChatService;
