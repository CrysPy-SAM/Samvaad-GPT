import mongoose from "mongoose";
import { ENV } from "./env.js";

let isConnected = false;

export const connectDB = async (retries = 5) => {
  if (isConnected) {
    console.log("✅ Using existing database connection");
    return;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
      isConnected = false;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err);
      isConnected = false;
    });

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

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log("👋 MongoDB connection closed");
  }
};