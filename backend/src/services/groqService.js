import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

/**
 * 🔍 FIXED: Safely extract readable text from ANY nested structure
 * ❌ NO MORE JSON.stringify() - that causes [object Object]!
 */
const extractMessageContent = (msg, depth = 0) => {
  // Prevent infinite recursion
  if (depth > 10) return "";
  if (!msg) return "";

  // ✅ Handle strings directly
  if (typeof msg === "string") {
    return msg;
  }

  // ✅ Handle arrays - recursively extract from each item
  if (Array.isArray(msg)) {
    return msg
      .map((item) => extractMessageContent(item, depth + 1))
      .filter((text) => text && text.length > 0)
      .join("");
  }

  // ✅ Handle objects - check priority fields FIRST
  if (typeof msg === "object" && msg !== null) {
    // Priority order - check these fields first
    if (msg.text) return extractMessageContent(msg.text, depth + 1);
    if (msg.content) return extractMessageContent(msg.content, depth + 1);
    if (msg.message) return extractMessageContent(msg.message, depth + 1);
    if (msg.parts) return extractMessageContent(msg.parts, depth + 1);
    if (msg.body) return extractMessageContent(msg.body, depth + 1);
    if (msg.data) return extractMessageContent(msg.data, depth + 1);
    if (msg.result) return extractMessageContent(msg.result, depth + 1);

    // ✅ If no known field, iterate through ALL object values
    const values = Object.values(msg)
      .map((value) => extractMessageContent(value, depth + 1))
      .filter((text) => text && text.length > 0);

    if (values.length > 0) {
      return values.join("");
    }
  }

  // ❌ NEVER use JSON.stringify - it causes [object Object]!
  return "";
};

export const groqService = {
  getAIResponse: async (messages, systemPrompt = null) => {
    if (!ENV.GROQ_API_KEY) {
      logger.error("❌ Groq API key not configured");
      return "⚠️ Groq API key not configured.";
    }

    try {
      const model = CONSTANTS?.GROQ?.MODEL || "llama-3.3-70b-versatile";
      const temperature = CONSTANTS?.GROQ?.TEMPERATURE ?? 0.7;
      const maxTokens = CONSTANTS?.GROQ?.MAX_TOKENS ?? 2048;
      const topP = CONSTANTS?.GROQ?.TOP_P ?? 0.9;

      logger.info(`📤 Sending request to Groq (model: ${model})`);

      const body = {
        model,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are SamvaadGPT, a helpful assistant.",
          },
          ...messages.slice(-10),
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      };

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg =
          errData?.error?.message || `Groq API error: ${response.status}`;
        logger.error("❌ Groq API failed:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      logger.debug(
        "📥 Raw Groq response:",
        JSON.stringify(data).slice(0, 300)
      );

      // ✅ Extract message safely
      const choice = data?.choices?.[0];
      if (!choice) {
        logger.warn("⚠️ No choices in Groq response");
        return "⚠️ Groq returned no choices.";
      }

      const messageData = choice?.message;
      if (!messageData) {
        logger.warn("⚠️ No message in Groq choice");
        return "⚠️ Groq returned no message.";
      }

      // ✅ Use our FIXED extraction function
      const text = extractMessageContent(messageData).trim();

      if (!text || text.length === 0) {
        logger.warn("⚠️ Extraction returned empty text:", messageData);
        return "⚠️ Unable to parse AI response. Please try again.";
      }

      logger.success(
        "✅ Groq response extracted successfully:",
        text.slice(0, 200)
      );
      return text;
    } catch (err) {
      logger.error("❌ Groq Service Error:", err.message);
      return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
    }
  },
};