import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

const DEFAULT_SYSTEM_PROMPT = `You are SamvaadGPT — a highly intelligent, friendly, and professional AI assistant created by Satyam Mishra.

**Response Guidelines:**
- Use emojis naturally to make responses engaging (✨, 💡, 🎯, ⚡, etc.)
- Structure responses with clear headings using ### for main sections
- Use **bold** for emphasis and *italics* for subtle highlights
- Create bulleted lists with proper spacing for better readability
- Use numbered lists for step-by-step instructions
- Add code blocks with syntax highlighting when sharing code
- Use > blockquotes for tips or notes
- Keep paragraphs short (2–3 sentences max)

**Tone:**
- Conversational yet professional
- Encouraging and supportive
- Explain complex topics in simple terms
- Use friendly emojis appropriately
`;

// ⚡ GROQ API (Fast Mode)
const getGroqResponse = async (messages, config) => {
  try {
    if (!ENV.GROQ_API_KEY) throw new Error("Groq API key not configured");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model || "llama-3.3-70b-versatile",
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    logger.error("Groq API Error:", err.message);
    throw err;
  }
};

// 🎨 GEMINI API (Creative Mode)
const getGeminiResponse = async (messages, config) => {
  try {
    if (!ENV.GEMINI_API_KEY) throw new Error("Gemini API key not configured");

    const contents = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
            topP: config.topP,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "⚠️ Gemini returned no content.";
  } catch (err) {
    logger.error("Gemini API Error:", err.message);
    throw err;
  }
};

// 🎯 MAIN AI SERVICE
export const aiService = {
  getAIResponse: async (messages, modelMode = "fast", systemPrompt = null) => {
    try {
      const modelConfig =
        CONSTANTS.AI_MODELS[modelMode.toUpperCase()] || CONSTANTS.AI_MODELS.FAST;

      const apiMessages = [
        { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...messages.slice(-10),
      ];

      logger.info(`Using ${modelConfig.name} (${modelConfig.provider})`);

      let response;
      switch (modelConfig.provider) {
        case "groq":
          response = await getGroqResponse(apiMessages, modelConfig);
          break;
        case "gemini":
          response = await getGeminiResponse(apiMessages, modelConfig);
          break;
        default:
          throw new Error(`Unknown provider: ${modelConfig.provider}`);
      }

      return response;
    } catch (err) {
      logger.error("AI Service Error:", err.message);
      return `⚠️ I'm having trouble with the ${
        CONSTANTS.AI_MODELS[modelMode.toUpperCase()]?.name || "selected model"
      }. Please try again or switch to another mode.`;
    }
  },

  getAvailableModels: () => {
    const models = [];
    if (ENV.GROQ_API_KEY) models.push(CONSTANTS.AI_MODELS.FAST);
    if (ENV.GEMINI_API_KEY) models.push(CONSTANTS.AI_MODELS.CREATIVE);
    return models;
  },
};
