export const CONSTANTS = {
  USER_ROLES: {
    GUEST: "guest",
    USER: "user",
    ADMIN: "admin",
  },
  
  MESSAGE_ROLES: {
    USER: "user",
    ASSISTANT: "assistant",
    SYSTEM: "system",
  },

  THREAD_LIMITS: {
    MAX_MESSAGES: 1000,
    MAX_TITLE_LENGTH: 200,
    MAX_MESSAGE_LENGTH: 10000,
  },

  FILE_TYPES: {
    ALLOWED: [
      "application/pdf",
      "text/plain",
      "text/javascript",
      "application/javascript",
      "application/json",
      "text/x-python",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "text/markdown",
    ],
  },

  GROQ: {
    MODEL: "llama-3.3-70b-versatile",
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.3,
    PRESENCE_PENALTY: 0.3,
  },
};
