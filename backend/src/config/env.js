import dotenv from "dotenv";
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const rawJwtSecret = process.env.JWT_SECRET;

if (nodeEnv === "production") {
  if (!rawJwtSecret || rawJwtSecret.trim() === "" || rawJwtSecret === "samvaad_secret_key_12345") {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required and must not use the default placeholder in production mode."
    );
  }
}

const resolvedJwtSecret =
  rawJwtSecret && rawJwtSecret.trim() !== ""
    ? rawJwtSecret.trim()
    : "dev_insecure_jwt_secret_only_for_local_env";

if (!rawJwtSecret && nodeEnv !== "production") {
  console.warn("⚠️ [WARN] JWT_SECRET is not set. Using dev fallback secret for local development.");
}

export const ENV = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: nodeEnv,

  // MongoDB connection
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/samvaadgpt",

  // JWT (Token) configs
  JWT_SECRET: resolvedJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // 🧠 AI API Keys
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY, // optional (leave empty if not using)

  // Twilio credentials
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  TWILIO_VERIFY_SID: process.env.TWILIO_VERIFY_SID,

  // Frontend URL
  FRONTEND_URL:
    process.env.FRONTEND_URL || "http://localhost:3000",

  // Upload & rate limit configs
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // max 100 requests per window
};
