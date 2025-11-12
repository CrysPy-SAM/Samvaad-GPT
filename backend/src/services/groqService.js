import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

/**
 * Helper to safely extract a readable string from diverse API response shapes.
 */
const extractMessageContent = (msg) => {
  if (!msg) return "";

  // If it's already a string
  if (typeof msg === "string") return msg;

  // If it's an array of parts
  if (Array.isArray(msg)) {
    return msg
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        if (part?.content) return typeof part.content === "string" ? part.content : JSON.stringify(part.content);
        return JSON.stringify(part);
      })
      .join("\n");
  }

  // If it's an object with nested fields
  if (typeof msg === "object") {
    // common shapes: { text: "..." } or { content: [...] } or { parts: [...] }
    if (msg.text && typeof msg.text === "string") return msg.text;
    if (msg.content) return extractMessageContent(msg.content);
    if (msg.parts && Array.isArray(msg.parts)) return extractMessageContent(msg.parts.map(p => p.text || p.content || p));
    // fallback: stringify prettily
    try {
      return JSON.stringify(msg, null, 2);
    } catch {
      return String(msg);
    }
  }

  return String(msg);
};

export const groqService = {
  getAIResponse: async (messages, systemPrompt = null) => {
    if (!ENV.GROQ_API_KEY) {
      logger.error("Groq API key is not configured");
      return "⚠️ Groq API key not configured. Please add GROQ_API_KEY in your environment.";
    }

    const maxRetries = 2;
    let attempt = 0;

    const model = (CONSTANTS?.GROQ?.MODEL) || "llama-3.3-70b-versatile";
    const temperature = (CONSTANTS?.GROQ?.TEMPERATURE) ?? 0.7;
    const maxTokens = (CONSTANTS?.GROQ?.MAX_TOKENS) ?? 2048;
    const topP = (CONSTANTS?.GROQ?.TOP_P) ?? 0.9;
    const freqPen = (CONSTANTS?.GROQ?.FREQUENCY_PENALTY) ?? 0;
    const presPen = (CONSTANTS?.GROQ?.PRESENCE_PENALTY) ?? 0;

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt || `You are SamvaadGPT — a helpful assistant.` },
        ...messages.slice(-10),
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: freqPen,
      presence_penalty: presPen,
    };

    while (attempt <= maxRetries) {
      try {
        attempt++;
        logger.info(`Using ${model} (groq) — attempt ${attempt}`);

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg = data?.error?.message || `HTTP ${res.status}`;
          logger.error("Groq API HTTP error:", errMsg, { status: res.status, attempt });
          // Retry on 5xx or network-ish issues
          if (res.status >= 500 && attempt <= maxRetries) {
            logger.info("Retrying Groq request (server error)...");
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }
          // Non-retriable -> return a helpful message
          return `⚠️ Groq API error: ${errMsg}`;
        }

        // safe extraction
        const rawMessage = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message ?? data?.choices?.[0];
        const messageText = extractMessageContent(rawMessage).trim();

        if (!messageText) {
          logger.warn("Groq returned empty content", { data });
          return "⚠️ Groq returned empty content. Please try again or switch model.";
        }

        logger.debug("Groq response (trim):", messageText.slice(0, 300));
        return messageText;
      } catch (err) {
        logger.error("Groq API Error:", err.message || err);
        if (attempt <= maxRetries) {
          logger.info("Retrying Groq request (network/exception)...");
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
      }
    }

    return "⚠️ Request failed after retries.";
  },
};
