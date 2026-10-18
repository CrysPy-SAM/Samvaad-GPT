import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB, disconnectDB } from "./src/config/database.js";
import { ENV } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

import listEndpoints from "express-list-endpoints";

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import fileRoutes from "./src/routes/file.routes.js";

const app = express();

// 🛡️ Reverse Proxy Configuration (Render uses 1 proxy hop)
app.set("trust proxy", 1);

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 🌐 Explicit CORS Whitelist
const allowedOrigins = new Set([
  "https://samvaad-gpt.vercel.app",
  "https://samvaad-gpt-sb6r.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
]);

if (ENV.FRONTEND_URL) {
  allowedOrigins.add(ENV.FRONTEND_URL.trim().replace(/\/+$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, "");
      if (
        allowedOrigins.has(normalizedOrigin) ||
        (ENV.NODE_ENV === "development" &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin))
      ) {
        return callback(null, true);
      }

      logger.warn(`🚫 Blocked unauthorized CORS request from origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "X-Requested-With"],
    maxAge: 86400,
  })
);

// Prevent sensitive user/chat data caching in browser or proxies
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW,
  max: ENV.RATE_LIMIT_MAX,
  message: { success: false, error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);
app.use("/auth/", limiter);
app.use("/chat/", limiter);
app.use("/file/", limiter);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request Logging (Development)
if (ENV.NODE_ENV === "development") {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENV.NODE_ENV,
  });
});

// API Routes (Canonical /api/ endpoints)
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/file", fileRoutes);

// Resilience Fallbacks (Ensures requests without /api prefix also resolve)
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/file", fileRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful Shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

// Uncaught error handlers
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

// Start Server
const startServer = async () => {
  try {
    app.listen(ENV.PORT, "0.0.0.0", () => {
      logger.success(`Server running on port ${ENV.PORT}`);
      logger.info(`Environment: ${ENV.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${ENV.PORT}/health`);
    });

    console.log("🔍 Registered routes:");
    console.table(listEndpoints(app));

    // Connect to database without blocking server listening
    await connectDB();
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

export { app };

if (process.env.NODE_ENV !== "test") {
  startServer();
}