import OpenAI from 'openai';

class AIChatService {
  constructor(baseURL, apiKey) {
    this.bot = new OpenAI({ baseURL, apiKey });
  }

  async send() {
    const completion = await this.bot.chat.completions.create({
      model: 'meta-llama/llama-3.1-70b-instruct:free',
      messages: [
        {
          role: 'user',
          content: 'Привет, меня зовут Григорий. Запомни мое имя!',
        },
        {
          role: 'user',
          content:
            'Привет, Григорий! Разумеется, я запомнил твое имя. Приятно познакомиться! Если тебе понадобится помощь или ты просто захочешь поговорить, не стесняйся написать мне в любое время. Я всегда рад пообщаться с тобой, Григорий!',
        },
      ],
    });

    console.log(completion);
    console.log(completion?.choices[0]?.message?.content);
  }
}

export default AIChatService;
