import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Routes
import chatRoutes from "./routes/chat.js";
import fileRoutes from "./routes/fileAnalyze.js";
import authRoutes from "./routes/auth.js";
// import twilioAuthRoutes from "./routes/twilioAuth.js";

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

// 🔒 Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// 🚦 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// 🔧 Body Parser Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 📊 Request Logging (Development)
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// 🏥 Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
// app.use("/api/auth", twilioAuthRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/file", fileRoutes);

// 🚫 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// ⚠️ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  res.status(err.status || 500).json({
    error: NODE_ENV === "production" ? "Internal server error" : err.message,
    ...(NODE_ENV === "development" && { stack: err.stack })
  });
});

// 🧠 MongoDB Connection with Retry Logic
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB successfully!");
  } catch (err) {
    console.error(`❌ MongoDB connection failed (${retries} retries left):`, err.message);
    if (retries > 0) {
      console.log("🔄 Retrying connection in 5 seconds...");
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("💀 MongoDB connection failed permanently. Exiting...");
      process.exit(1);
    }
  }
};

// MongoDB Event Listeners
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 SamvaadGPT server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
