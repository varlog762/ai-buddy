import OpenAI from 'openai';
import {
  MESSAGE_FROM_AI,
  USER_ROLE,
  GEMINI,
  DEEPSEEK,
  LLAMA,
  ASSISTANT_ROLE,
  SOMETHING_WENT_WRONG,
} from '../constants/index.js';

class AIChatService {
  models = [GEMINI, LLAMA, DEEPSEEK];

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
        role: ASSISTANT_ROLE,
      });
    } catch (error) {
      this.eventEmitter.emit(MESSAGE_FROM_AI, {
        chatId,
        message: SOMETHING_WENT_WRONG,
        role: ASSISTANT_ROLE,
      });

      console.error(error);
    }
  }
}

export default AIChatService;
