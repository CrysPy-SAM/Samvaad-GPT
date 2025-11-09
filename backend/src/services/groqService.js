import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export const groqService = {
  getAIResponse: async (messages, systemPrompt = null) => {
    try {
      const defaultSystemPrompt =
        "You are SamvaadGPT — a highly intelligent, friendly, and professional AI assistant created by Satyam Mishra. You provide clear, accurate, and helpful responses. You can engage in thoughtful conversations, explain complex topics, write code, analyze data, and assist with various tasks. Always be respectful, concise, and informative.";

      const apiMessages = [
        {
          role: "system",
          content: systemPrompt || defaultSystemPrompt,
        },
        ...messages.slice(-10),
      ];

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: CONSTANTS.GROQ.MODEL,
            messages: apiMessages,
            temperature: CONSTANTS.GROQ.TEMPERATURE,
            max_tokens: CONSTANTS.GROQ.MAX_TOKENS,
            top_p: CONSTANTS.GROQ.TOP_P,
            frequency_penalty: CONSTANTS.GROQ.FREQUENCY_PENALTY,
            presence_penalty: CONSTANTS.GROQ.PRESENCE_PENALTY,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        logger.error("Groq API Error:", data.error);
        return `⚠️ I'm experiencing technical difficulties. Please try again.`;
      }

      return (
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ I'm having trouble generating a response right now."
      );
    } catch (err) {
      logger.error("Groq API Error:", err.message);
      return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
    }
  },
};
