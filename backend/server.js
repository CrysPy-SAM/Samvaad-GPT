import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";

// Routes
import chatRoutes from "./routes/chat.js";
import fileRoutes from "./routes/fileAnalyze.js";

const app = express();
const PORT = process.env.PORT || 8080;

// 🔧 Middleware
app.use(cors());
app.use(express.json());

// 🔌 Routes
app.use("/api/chat", chatRoutes); // 🧠 ChatGPT-like routes
app.use("/api/file", fileRoutes); // 📁 File analyzer routes

// 🧠 MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (err) {
    console.error("❌ Failed to connect with MongoDB:", err.message);
  }
};

// ⚙️ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Samvaad-GPT server running on port ${PORT}`);
  connectDB();
});
