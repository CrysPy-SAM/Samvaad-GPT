import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const rawJwtSecret = process.env.JWT_SECRET;

let resolvedJwtSecret = rawJwtSecret ? rawJwtSecret.trim() : "";

if (!resolvedJwtSecret || resolvedJwtSecret === "samvaad_secret_key_12345") {
  if (nodeEnv === "production") {
    // Auto-generate a secure 256-bit key so Render never crashes, while protecting against token forgery
    resolvedJwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "⚠️ [SECURITY WARNING] JWT_SECRET is not set (or is using placeholder) in Render environment variables."
    );
    console.warn(
      "👉 An ephemeral 256-bit secure key was generated so your server can boot safely without downtime. Please add JWT_SECRET to your Render Environment tab for persistent sessions across restarts."
    );
  } else {
    resolvedJwtSecret = "dev_insecure_jwt_secret_only_for_local_env";
    console.warn("⚠️ [WARN] JWT_SECRET is not set. Using dev fallback secret for local development.");
  }
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
