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
      ],
    });

    console.log(completion);
    console.log(completion?.choices[0]?.message?.content);
  }
}

export default AIChatService;
