import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 8080;

// 🔧 Middleware
app.use(express.json());
app.use(cors());

// 🔌 Routes
app.use("/api", chatRoutes);

// ⚙️ Start the server & connect to DB
app.listen(PORT, () => {
  console.log(`🚀 Samvaad-GPT server running on port ${PORT}`);
  connectDB();
});

// 🧠 MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB successfully!");
  } catch (err) {
    console.error("❌ Failed to connect with MongoDB:", err.message);
  }
};
