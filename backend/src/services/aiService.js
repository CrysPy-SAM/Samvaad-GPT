import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

const DEFAULT_SYSTEM_PROMPT = `You are SamvaadGPT — a highly capable, helpful, and sophisticated AI assistant created by Satyam Mishra, designed to provide ChatGPT-caliber answers.

### Core Guidelines:
1. **Formatting & Structure:**
   - Present responses clearly with Markdown: use headers (###), bold text, bullet points, and numbered lists where appropriate.
   - Keep paragraphs concise, informative, and easy to read.
   - Use emojis tastefully to enhance readability, without cluttering the response.
   - Use mathematical formatting (KaTeX) when writing formulas (e.g. $E=mc^2$ or display formulas with $$...$$).
   - Use tables for structured comparisons and data summaries.

2. **Code & Technical Excellence:**
   - Always write complete, runnable, and robust code. Never truncate or leave lazy placeholders (e.g., "// write your logic here") unless explicitly requested.
   - Always wrap code in fenced code blocks with the exact language identifier (e.g., \`\`\`javascript, \`\`\`python, \`\`\`html, \`\`\`css, \`\`\`sql, \`\`\`bash, \`\`\`cpp, \`\`\`json, etc.).
   - Follow clean-code conventions, modern best practices, and include concise comments explaining tricky logic.
   - Provide a clear, step-by-step explanation of how the code works and how to run it.

3. **Tone & Interaction:**
   - Friendly, professional, thoughtful, and articulate.
   - Direct and solution-oriented: answer the user's question first, then provide supporting details and examples.
`;

// ⚡ GROQ API (Fast Mode)
const getGroqResponse = async (messages, config) => {
  try {
    if (!ENV.GROQ_API_KEY) throw new Error("Groq API key not configured");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model || CONSTANTS.AI_MODELS.FAST.model || "qwen/qwen3.8-27b",
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: config.topP,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    // ✅ Extract content safely
    let content = data?.choices?.[0]?.message?.content;

    // ✅ Handle null/undefined/non-string
    if (!content || typeof content !== "string") {
      if (content === null || content === undefined) {
        logger.warn("⚠️ Groq returned null/undefined content");
      } else {
        logger.warn(`⚠️ Groq returned non-string content (type: ${typeof content}):`, content);
        content = String(content);
      }
    }

    content = (content || "").trim();

    if (content.length === 0) {
      logger.warn("⚠️ Groq returned empty content");
      return "⚠️ Groq returned no readable content. Please try again.";
    }

    logger.success("✅ Groq Response received, length:", content.length);
    return content;
  } catch (err) {
    logger.error("❌ Groq API Error:", err.message);
    return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
  }
};

// 🎨 GEMINI API (Creative Mode)
const getGeminiResponse = async (messages, config) => {
  try {
    if (!ENV.GEMINI_API_KEY) throw new Error("Gemini API key not configured");

    const systemMsg = messages.find((msg) => msg.role === "system");
    const contents = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const requestBody = {
      contents,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP,
      },
    };

    if (systemMsg?.content) {
      requestBody.system_instruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    // ✅ Extract text safely
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      if (text === null || text === undefined) {
        logger.warn("⚠️ Gemini returned null/undefined content");
      } else {
        logger.warn(`⚠️ Gemini returned non-string content (type: ${typeof text}):`, text);
        text = String(text);
      }
    }

    text = (text || "").trim();

    if (text.length === 0) {
      logger.warn("⚠️ Gemini returned empty content");
      return "⚠️ Gemini returned no content.";
    }

    logger.success("✅ Gemini Response received, length:", text.length);
    return text;
  } catch (err) {
    logger.error("❌ Gemini API Error:", err.message);
    return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
  }
};

// 🎯 MAIN AI SERVICE
export const aiService = {
  getAIResponse: async (
    messages,
    modelMode = "fast",
    systemPrompt = null
  ) => {
    try {
      const modelConfig =
        CONSTANTS.AI_MODELS[modelMode.toUpperCase()] ||
        CONSTANTS.AI_MODELS.FAST;

      const apiMessages = [
        { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...messages.slice(-10),
      ];

      logger.info(`Using ${modelConfig.name} (${modelConfig.provider})`);

      let response;
      if (modelConfig.provider === "groq") {
        response = await getGroqResponse(apiMessages, modelConfig);
        if (!response || response.startsWith("⚠️")) {
          logger.warn("Groq failed or returned error, attempting Gemini fallback...");
          const fallbackResp = await getGeminiResponse(apiMessages, CONSTANTS.AI_MODELS.CREATIVE);
          if (fallbackResp && !fallbackResp.startsWith("⚠️")) {
            response = fallbackResp;
          }
        }
      } else if (modelConfig.provider === "gemini") {
        response = await getGeminiResponse(apiMessages, modelConfig);
        if (!response || response.startsWith("⚠️")) {
          logger.warn("Gemini failed or returned error, attempting Groq fallback...");
          const fallbackResp = await getGroqResponse(apiMessages, CONSTANTS.AI_MODELS.FAST);
          if (fallbackResp && !fallbackResp.startsWith("⚠️")) {
            response = fallbackResp;
          }
        }
      } else {
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
      }

      // ✅ FINAL CHECK: Ensure response is always a string
      if (typeof response !== "string") {
        logger.error("❌ Final response is not a string:", typeof response);
        return "⚠️ Invalid response format received.";
      }

      response = response.trim();

      if (response.length === 0) {
        logger.error("❌ Final response is empty");
        return "⚠️ AI service returned an empty response.";
      }

      return response;
    } catch (err) {
      logger.error("❌ AI Service Error:", err.message);
      return `⚠️ I'm having trouble with the ${
        CONSTANTS.AI_MODELS[modelMode.toUpperCase()]?.name ||
        "selected model"
      }. Please try again or switch to another mode.`;
    }
  },

  getAvailableModels: () => {
    const models = [];
    if (ENV.GROQ_API_KEY) {
      models.push(CONSTANTS.AI_MODELS.FAST);
      models.push(CONSTANTS.AI_MODELS.PRO);
    }
    if (ENV.GEMINI_API_KEY) models.push(CONSTANTS.AI_MODELS.CREATIVE);
    return models;
  },
};