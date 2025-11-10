import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./src/config/database.js";
import { ENV } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import fileRoutes from "./src/routes/file.routes.js";

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: ENV.FRONTEND_URL,
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW,
  max: ENV.RATE_LIMIT_MAX,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/file", fileRoutes);

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

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      logger.success(`Server running on port ${ENV.PORT}`);
      logger.info(`Environment: ${ENV.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${ENV.PORT}/health`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

import listEndpoints from "express-list-endpoints";
console.log("🔍 Registered routes:");
console.table(listEndpoints(app));


startServer();