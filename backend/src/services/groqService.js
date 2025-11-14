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

      logger.debug("📥 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

      // ✅ CRITICAL: Extract content safely
      let content = data?.choices?.[0]?.message?.content;

      logger.debug("Extracted content type:", typeof content);
      logger.debug("Extracted content length:", content?.length || 0);

      // ✅ Handle null/undefined
      if (content === null || content === undefined) {
        logger.warn("⚠️ Content is null/undefined, returning fallback");
        return "⚠️ Groq returned no content.";
      }

      // ✅ ENSURE it's a string - convert if needed
      if (typeof content !== "string") {
        logger.warn(`⚠️ Content is not a string, it's: ${typeof content}`);
        logger.warn("Content value:", JSON.stringify(content, null, 2));
        content = String(content);
      }

      // ✅ Trim whitespace
      content = content.trim();

      // ✅ Check if empty
      if (content.length === 0) {
        logger.warn("⚠️ Content is empty string after trim");
        return "⚠️ Groq returned empty response.";
      }

      logger.success("✅ Groq Success - Content length:", content.length);
      logger.debug("✅ Response preview:", content.substring(0, 200));

      return content;
    } catch (err) {
      logger.error("❌ Groq Service Exception:", err.message);
      logger.error("Stack:", err.stack);
      return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
    }
  },
};