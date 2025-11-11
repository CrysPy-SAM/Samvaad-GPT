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
      model: "gemini-2.0-flash", // ✅ verified working model name
      temperature: 0.9,
      maxTokens: 2048,
      topP: 0.9,
    },
  },

  // ✅ Add this section ↓↓↓
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
    MAX_SIZE_MB: 10, // optional safety config
  },
};
