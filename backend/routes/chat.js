import express from "express";
import Thread from "../models/Thread.js";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "./auth.js"; // ✅ added for route protection

const router = express.Router();

// 🧠 Helper function — Call Groq API with conversation history
const getGroqAPIResponse = async (messages, systemPrompt = null) => {
  try {
    const systemMessage = systemPrompt || 
      "You are SamvaadGPT — a highly intelligent, friendly, and professional AI assistant created by Satyam Mishra. You provide clear, accurate, and helpful responses. You can engage in thoughtful conversations, explain complex topics, write code, analyze data, and assist with various tasks. Always be respectful, concise, and informative.";

    const apiMessages = [
      { role: "system", content: systemMessage },
      ...messages.slice(-10)
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return `⚠️ I'm experiencing technical difficulties. Please try again.`;
    }

    return data?.choices?.[0]?.message?.content?.trim() || 
           "⚠️ I'm having trouble generating a response right now.";
  } catch (err) {
    console.error("❌ Groq API Error:", err.message);
    return "⚠️ I'm currently unable to process your request. Please try again in a moment.";
  }
};

// 🔍 Input Validation Middleware
const validateChatInput = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required and must be a string" });
  }
  
  if (message.trim().length === 0) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  
  if (message.length > 4000) {
    return res.status(400).json({ error: "Message is too long (max 4000 characters)" });
  }
  
  next();
};

// ✅ Protect all routes below with authMiddleware
router.use(authMiddleware);

// ✅ Get all threads (user-specific, paginated)
router.get("/threads", async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      Thread.find({ userId })
        .select("threadId title updatedAt createdAt messages")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Thread.countDocuments({ userId })
    ]);

    const enrichedThreads = threads.map(thread => ({
      ...thread,
      messageCount: thread.messages?.length || 0,
      lastMessage: thread.messages?.[thread.messages.length - 1]?.content.slice(0, 100) || ""
    }));

    res.status(200).json({
      threads: enrichedThreads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("❌ Error fetching threads:", err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// ✅ Get specific thread by ID (user-owned only)
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId, userId: req.user.id }).lean();

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({
      threadId: thread.threadId,
      title: thread.title,
      messages: thread.messages,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    });
  } catch (err) {
    console.error("❌ Error fetching thread:", err);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

// ✅ Create a new thread (linked to user)
router.post("/thread", async (req, res) => {
  try {
    const { title } = req.body;
    const threadId = uuidv4();

    const thread = new Thread({
      threadId,
      title: title || "New Chat",
      messages: [],
      userId: req.user.id // ✅ added
    });

    await thread.save();

    res.status(201).json({
      threadId: thread.threadId,
      title: thread.title,
      createdAt: thread.createdAt
    });
  } catch (err) {
    console.error("❌ Error creating thread:", err);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// ✅ Update thread title
router.patch("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const thread = await Thread.findOneAndUpdate(
      { threadId, userId: req.user.id }, // ✅ user restriction
      { title: title.trim(), updatedAt: new Date() },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({
      threadId: thread.threadId,
      title: thread.title,
      updatedAt: thread.updatedAt
    });
  } catch (err) {
    console.error("❌ Error updating thread:", err);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// ✅ Delete a thread by ID
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.user.id }); // ✅ restricted

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Thread deleted successfully",
      threadId 
    });
  } catch (err) {
    console.error("❌ Error deleting thread:", err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// ✅ Chat endpoint — Send message and get AI reply
router.post("/chat", validateChatInput, async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId) {
    return res.status(400).json({ error: "threadId is required" });
  }

  try {
    let thread = await Thread.findOne({ threadId, userId: req.user.id }); // ✅ user-restricted

    if (!thread) {
      return res.status(404).json({ 
        error: "Thread not found. Please create a thread first." 
      });
    }

    const userMessage = {
      role: "user",
      content: message.trim()
    };
    thread.messages.push(userMessage);

    const conversationHistory = thread.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const assistantReply = await getGroqAPIResponse(conversationHistory);

    const assistantMessage = {
      role: "assistant",
      content: assistantReply
    };
    thread.messages.push(assistantMessage);

    if (thread.messages.length === 2) {
      thread.title = message.slice(0, 50);
    }

    thread.updatedAt = new Date();
    await thread.save();

    res.status(200).json({
      success: true,
      message: {
        role: "assistant",
        content: assistantReply
      },
      threadId: thread.threadId
    });
  } catch (err) {
    console.error("❌ Chat route error:", err);
    res.status(500).json({ 
      error: "Something went wrong while processing your message" 
    });
  }
});

// ✅ Clear all messages in a thread
router.delete("/thread/:threadId/messages", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOneAndUpdate(
      { threadId, userId: req.user.id }, // ✅ user-restricted
      { messages: [], updatedAt: new Date() },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({
      success: true,
      message: "All messages cleared",
      threadId
    });
  } catch (err) {
    console.error("❌ Error clearing messages:", err);
    res.status(500).json({ error: "Failed to clear messages" });
  }
});

export default router;
