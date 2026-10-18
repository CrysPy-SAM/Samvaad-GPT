import { ENV } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/response.js";

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
  if (!ENV.GROQ_API_KEY) {
    logger.warn("⚠️ Groq API key not configured");
    return null;
  }

  try {
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
        signal: AbortSignal.timeout(25000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      logger.error("❌ Groq API Error:", errMsg);
      return null;
    }

    // Extract content safely
    let content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      logger.warn("⚠️ Groq returned empty or non-string content");
      return null;
    }

    logger.success("✅ Groq Response received, length:", content.trim().length);
    return content.trim();
  } catch (err) {
    logger.error("❌ Groq Request Error:", err.message);
    return null;
  }
};

// 🎨 GEMINI API (Creative Mode)
const getGeminiResponse = async (messages, config) => {
  if (!ENV.GEMINI_API_KEY) {
    logger.warn("⚠️ Gemini API key not configured");
    return null;
  }

  try {
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
        signal: AbortSignal.timeout(25000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      logger.error("❌ Gemini API Error:", errMsg);
      return null;
    }

    // Extract text safely
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      logger.warn("⚠️ Gemini returned empty or non-string content");
      return null;
    }

    logger.success("✅ Gemini Response received, length:", text.trim().length);
    return text.trim();
  } catch (err) {
    logger.error("❌ Gemini Request Error:", err.message);
    return null;
  }
};

// 🎯 MAIN AI SERVICE
export const aiService = {
  getAIResponse: async (
    messages,
    modelMode = "fast",
    systemPrompt = null
  ) => {
    const modelConfig =
      CONSTANTS.AI_MODELS[modelMode.toUpperCase()] ||
      CONSTANTS.AI_MODELS.FAST;

    const apiMessages = [
      { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...messages.slice(-10),
    ];

    logger.info(`Using ${modelConfig.name} (${modelConfig.provider})`);

    let response = null;

    if (modelConfig.provider === "groq") {
      response = await getGroqResponse(apiMessages, modelConfig);
      // Attempt Gemini fallback if Groq failed
      if (!response && ENV.GEMINI_API_KEY) {
        logger.warn("Groq primary request failed. Attempting Gemini fallback...");
        response = await getGeminiResponse(apiMessages, CONSTANTS.AI_MODELS.CREATIVE);
      }
    } else if (modelConfig.provider === "gemini") {
      response = await getGeminiResponse(apiMessages, modelConfig);
      // Attempt Groq fallback if Gemini failed
      if (!response && ENV.GROQ_API_KEY) {
        logger.warn("Gemini primary request failed. Attempting Groq fallback...");
        response = await getGroqResponse(apiMessages, CONSTANTS.AI_MODELS.FAST);
      }
    } else {
      throw new ApiError(400, `Unknown AI provider: ${modelConfig.provider}`);
    }

    if (!response || typeof response !== "string" || response.trim().length === 0) {
      logger.error(`❌ All AI providers failed for model mode: ${modelMode}`);
      throw new ApiError(
        503,
        `AI service is temporarily unavailable for ${modelConfig.name}. Please try again shortly or select a different model.`
      );
    }

    return response.trim();
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