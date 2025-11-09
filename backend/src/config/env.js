import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || "development",

  // MongoDB connection
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/samvaadgpt",

  // JWT (Token) configs
  JWT_SECRET:
    process.env.JWT_SECRET || "samvaad_secret_key_12345",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // GROQ API key
  GROQ_API_KEY: process.env.GROQ_API_KEY,

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
