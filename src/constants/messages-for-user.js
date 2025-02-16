export const MESSAGES_TO_USER = {
  START: `*Welcome to AI Chat Bot!* 🤖  

This is an advanced AI-powered chat bot for Telegram, designed for intelligent and natural conversations with multiple Large Language Models (LLMs).  

**Key Features:**  

✅ AI-driven responses for engaging interactions  

✅ Supports multiple LLMs:  
   - 🦙 *Meta Llama 3.1* (Default) - \`llama-3.1-70b\`  
   - 🔍 *DeepSeek* - \`deepseek-r1\`  
   - 🌟 *Google Gemini* - \`gemini-2.0-flash-lite-preview-02-05\`  

✅ Easily switch models anytime using \`/change-model\`  

✅ Chat history management  

*By default, Meta Llama 3.1 is selected.* However, you can switch models now or later using the \`/change-model\` command.  

⚠️ *If a model is temporarily unavailable due to high demand (you may receive errors), consider switching to another or waiting for access to be restored.*  

Would you like to change the model now or keep the default one?`,

  CHOOSE_MODEL: `*Choose a model:*`,

  DELETE_CHAT_HISTORY_CONFIRMATION: `🗑 *Clearing Chat History*  

This action will delete the chat history from our database, meaning the bot will forget the previous conversation.  

However, messages in this chat will not be removed from Telegram. If you wish to clear the chat screen, you can do so manually using Telegram’s interface.  

Are you sure you want to delete the chat history?`,
  SHOW_MODEL: `*Current Model:*`,
};
