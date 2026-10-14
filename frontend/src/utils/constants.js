const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim().replace(/\/+$/, "");
  // Ensure the base URL always ends with /api
  if (!trimmed.endsWith("/api")) {
    trimmed = `${trimmed}/api`;
  }
  return trimmed;
};

const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If running in browser and NOT on localhost / 127.0.0.1 (i.e. on deployed production site like vercel.app)
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return normalizeUrl(envUrl);
    }
    // Automatic fallback to live Render production backend
    return "https://samvaad-gpt.onrender.com/api";
  }

  // Localhost development
  if (envUrl) {
    return normalizeUrl(envUrl);
  }
  return "http://localhost:8080/api";
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