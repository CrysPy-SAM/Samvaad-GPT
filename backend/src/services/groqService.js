import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

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

      logger.info(`📤 Groq Request - Model: ${model}`);

      const requestBody = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are SamvaadGPT, a helpful assistant.",
          },
          ...messages.slice(-10),
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      };

      logger.debug("Request body:", JSON.stringify(requestBody, null, 2).slice(0, 200));

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg =
          errData?.error?.message || `Groq API error: ${response.status}`;
        logger.error("❌ Groq HTTP Error:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // 🔴 MOST IMPORTANT: Log full response
      logger.debug("📥 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

      // ✅ Get content safely
      const content = data?.choices?.[0]?.message?.content;

      logger.debug("Extracted content type:", typeof content);
      logger.debug("Extracted content:", content);

      // ✅ Ensure it's a string
      if (!content) {
        logger.warn("⚠️ Content is null/undefined");
        return "⚠️ Groq returned no content.";
      }

      if (typeof content !== "string") {
        logger.error("❌ Content is not a string, it's:", typeof content);
        logger.error("Content value:", JSON.stringify(content, null, 2));
        
        // Try to convert to string as fallback
        const stringified = String(content);
        logger.warn("Attempting to stringify content:", stringified);
        return stringified;
      }

      const trimmedContent = content.trim();

      if (trimmedContent.length === 0) {
        logger.warn("⚠️ Content is empty string");
        return "⚠️ Groq returned empty response.";
      }

      logger.success("✅ Groq Success - Content length:", trimmedContent.length);
      return trimmedContent;
    } catch (err) {
      logger.error("❌ Groq Service Exception:", err.message);
      logger.error("Stack:", err.stack);
      return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
    }
  },
};