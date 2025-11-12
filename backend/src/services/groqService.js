import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

const extractMessageContent = (msg, depth = 0) => {
  if (depth > 10) return "";
  if (!msg) return "";

  if (typeof msg === "string") {
    return msg;
  }

  if (Array.isArray(msg)) {
    return msg
      .map((item) => extractMessageContent(item, depth + 1))
      .filter((text) => text && text.length > 0)
      .join("");
  }

  if (typeof msg === "object" && msg !== null) {
    if (msg.text) return extractMessageContent(msg.text, depth + 1);
    if (msg.content) return extractMessageContent(msg.content, depth + 1);
    if (msg.message) return extractMessageContent(msg.message, depth + 1);
    if (msg.parts) return extractMessageContent(msg.parts, depth + 1);
    if (msg.body) return extractMessageContent(msg.body, depth + 1);

    const values = Object.values(msg)
      .map((value) => extractMessageContent(value, depth + 1))
      .filter((text) => text && text.length > 0);

    if (values.length > 0) {
      return values.join("");
    }
  }

  return "";
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
        throw new Error(
          errData?.error?.message || `Groq API error: ${response.status}`
        );
      }

      const data = await response.json();

      // 🔴 DEBUG: Log entire response
      console.log("========== GROQ FULL RESPONSE ==========");
      console.log(JSON.stringify(data, null, 2));
      console.log("========== END RESPONSE ==========");

      // 🔴 DEBUG: Log choice structure
      console.log("choices[0]:", JSON.stringify(data?.choices?.[0], null, 2));
      console.log("message:", JSON.stringify(data?.choices?.[0]?.message, null, 2));

      const message = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message;

      // 🔴 DEBUG: Log what we extracted
      console.log("Raw message before extraction:", message);
      console.log("Type of message:", typeof message);
      console.log("Is array?", Array.isArray(message));

      const text = extractMessageContent(message)?.trim();

      // 🔴 DEBUG: Log final text
      console.log("Final extracted text:", text);
      console.log("Text length:", text?.length);

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