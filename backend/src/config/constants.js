export const CONSTANTS = {
  AI_MODELS: {
    FAST: {
      name: "⚡ Fast (Groq Llama 3.3 70B)",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    },
    CREATIVE: {
      name: "🎨 Creative (Gemini 2.0 Flash)",
      provider: "gemini",
      model: "gemini-2.0-flash",
      temperature: 0.9,
      maxTokens: 2048,
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
    MODEL: "llama-3.3-70b-versatile",
    TEMPERATURE: 0.7,
    MAX_TOKENS: 2048,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0,
    PRESENCE_PENALTY: 0,
  },
};
