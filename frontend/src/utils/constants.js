export const APP_CONFIG = {
  NAME: "Samvaad-GPT",
  CREATOR: "Satyam Mishra",
  GUEST_CHAT_LIMIT: 5,
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
};

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  GUEST_MESSAGES: "guestMessages",
  GUEST_COUNT: "guestChatCount",
  THEME: "theme",
};

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};