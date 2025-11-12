import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

/**
 * 🔍 Safely extract readable text from any message structure (array, object, string)
 */
const extractMessageContent = (msg) => {
  if (!msg) return "";

  if (typeof msg === "string") return msg;

  // If it's an array (Groq sometimes returns content parts)
  if (Array.isArray(msg)) {
    return msg
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.text) return item.text;
        if (item.content) return extractMessageContent(item.content);
        return "";
      })
      .join("");
  }

  // If it's an object with text/content fields
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

export const groqService = {
  getAIResponse: async (messages, systemPrompt = null) => {
    if (!ENV.GROQ_API_KEY) {
      return "⚠️ Groq API key not configured.";
    }

    try {
      const model = CONSTANTS?.GROQ?.MODEL || "llama-3.3-70b-versatile";
      const temperature = CONSTANTS?.GROQ?.TEMPERATURE ?? 0.7;
      const maxTokens = CONSTANTS?.GROQ?.MAX_TOKENS ?? 2048;
      const topP = CONSTANTS?.GROQ?.TOP_P ?? 0.9;

      const body = {
        model,
        messages: [
          { role: "system", content: systemPrompt || "You are SamvaadGPT, a helpful assistant." },
          ...messages.slice(-10),
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message;
      const text = extractMessageContent(message)?.trim();

      if (!text) {
        logger.warn("⚠️ Groq returned empty or malformed content:", data);
        return "⚠️ Unable to parse AI response. Please try again.";
      }

      logger.debug("✅ Groq response preview:", text.slice(0, 200));
      return text;
    } catch (err) {
      logger.error("❌ Groq API Error:", err.message);
      return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
    }
  },
};
