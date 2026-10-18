export const CONSTANTS = {
  AI_MODELS: {
    FAST: {
      name: "⚡ Fast (Groq Qwen 27B)",
      provider: "groq",
      model: "qwen/qwen3.8-27b",
      temperature: 0.6,
      maxTokens: 4096,
      topP: 0.9,
    },
    PRO: {
      name: "🧠 Smart (GPT OSS 120B)",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
    },
    CREATIVE: {
      name: "🎨 Creative (Gemini Flash)",
      provider: "gemini",
      model: "gemini-3.5-flash",
      temperature: 0.8,
      maxTokens: 4096,
      topP: 0.9,
    },
  },
  FILE_TYPES: {
    ALLOWED: [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    MAX_SIZE_MB: 10,
  },
  // ✅ Add this for groqService.js
  GROQ: {
    MODEL: "qwen/qwen3.8-27b",
    TEMPERATURE: 0.6,
    MAX_TOKENS: 4096,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0,
    PRESENCE_PENALTY: 0,
  },
};
