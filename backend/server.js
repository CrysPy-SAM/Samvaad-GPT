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

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: true, // Allow request origin dynamically for localhost, Vercel, Render, etc.
    credentials: true,
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
  message: "Too many requests from this IP, please try again later.",
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

startServer();