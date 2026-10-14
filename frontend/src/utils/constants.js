const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If running in browser and NOT on localhost / 127.0.0.1 (i.e. on deployed production site)
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    // Automatic fallback to live Render production backend
    return "https://samvaad-gpt.onrender.com/api";
  }

  // Localhost development
  return envUrl || "http://localhost:8080/api";
};

export const APP_CONFIG = {
  NAME: "Samvaad-GPT",
  CREATOR: "Satyam Mishra",
  GUEST_CHAT_LIMIT: 5,
  API_URL: resolveApiUrl(),
};

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  GUEST_MESSAGES: "guestMessages",
  GUEST_COUNT: "guestChatCount",
  THEME: "theme",
  MODEL_MODE: "modelMode",
};

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};