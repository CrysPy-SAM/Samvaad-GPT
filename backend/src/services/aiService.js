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

/** 🧠 Helper: Safely extract readable text from structured API responses */
const extractMessageContent = (msg) => {
  if (!msg) return "";
  if (typeof msg === "string") return msg;

  if (Array.isArray(msg)) {
    return msg
      .map((part) => {
        if (typeof part === "string") return part;
        if (part.text) return part.text;
        if (part.content) return extractMessageContent(part.content);
        return "";
      })
      .join("");
  }

  if (typeof msg === "object") {
    if (msg.text) return msg.text;
    if (msg.content) return extractMessageContent(msg.content);
    if (msg.parts) return extractMessageContent(msg.parts);
    try {
      return JSON.stringify(msg);
    } catch {
      return String(msg);
    }
  }

  return String(msg);
};

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

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    // 🧠 Recursively extract all readable text
    const flatten = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value))
        return value.map((v) => flatten(v)).join("");
      if (typeof value === "object") {
        if (value.text) return flatten(value.text);
        if (value.content) return flatten(value.content);
        if (value.parts) return flatten(value.parts);
        // Some Groq payloads wrap code/text in {type,text}
        const vals = Object.values(value).map((v) => flatten(v));
        return vals.join("");
      }
      return String(value);
    };

    const raw = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message;
    const text = flatten(raw).trim();

    if (!text) {
      logger.warn("⚠️ Groq returned empty or malformed content:", data);
      return "⚠️ Groq returned no readable content. Please try again.";
    }

    logger.debug("Groq Response (first 300 chars):", text.slice(0, 300));
    return text;
  } catch (err) {
    logger.error("Groq API Error:", err.message);
    return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
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

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n")?.trim() ||
      "⚠️ Gemini returned no content.";

    return text;
  } catch (err) {
    logger.error("Gemini API Error:", err.message);
    return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
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
