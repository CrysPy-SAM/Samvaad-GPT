import rateLimit from "express-rate-limit";
import { ENV } from "../config/env.js";

export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const apiLimiter = createRateLimiter(
  ENV.RATE_LIMIT_WINDOW,
  ENV.RATE_LIMIT_MAX,
  "Too many requests from this IP, please try again later."
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts, please try again later."
);

export const fileLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 files
  "Too many file uploads, please try again later."
);