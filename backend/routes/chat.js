import express from "express";
import Thread from "../models/Thread.js";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// 🧠 Helper function — Call Groq API with conversation history
const getGroqAPIResponse = async (messages, systemPrompt = null) => {
  try {
    const systemMessage = systemPrompt || 
      "You are SamvaadGPT — a highly intelligent, friendly, and professional AI assistant created by Satyam Mishra. You provide clear, accurate, and helpful responses. You can engage in thoughtful conversations, explain complex topics, write code, analyze data, and assist with various tasks. Always be respectful, concise, and informative.";

    const apiMessages = [
      { role: "system", content: systemMessage },
      ...messages.slice(-10) // Keep last 10 messages for context
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

// ✅ Get all threads (sorted by most recent, with pagination)
router.get("/threads", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      Thread.find({})
        .select("threadId title updatedAt createdAt messages")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Thread.countDocuments({})
    ]);

    // Add message count and last message preview
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

// ✅ Get specific thread by ID
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId }).lean();

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

// ✅ Create a new thread
router.post("/thread", async (req, res) => {
  try {
    const { title } = req.body;
    const threadId = uuidv4();

    const thread = new Thread({
      threadId,
      title: title || "New Chat",
      messages: []
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
      { threadId },
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
    const deletedThread = await Thread.findOneAndDelete({ threadId });

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
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ 
        error: "Thread not found. Please create a thread first." 
      });
    }

    // Add user message
    const userMessage = {
      role: "user",
      content: message.trim()
    };
    thread.messages.push(userMessage);

    // Prepare conversation history for API
    const conversationHistory = thread.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get AI response with full context
    const assistantReply = await getGroqAPIResponse(conversationHistory);

    // Add assistant reply
    const assistantMessage = {
      role: "assistant",
      content: assistantReply
    };
    thread.messages.push(assistantMessage);

    // Update title if this is the first message
    if (thread.messages.length === 2) {
      thread.title = message.slice(0, 50);
    }

    thread.updatedAt = new Date();
    await thread.save();

    res.status(200).json({
      success: true,
      message: {
        role: "assistant",
        content: assistantReply,
        timestamp: assistantMessage.timestamp
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

// ✅ Streaming chat endpoint (for real-time responses)
router.post("/chat/stream", validateChatInput, async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId) {
    return res.status(400).json({ error: "threadId is required" });
  }

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ 
        error: "Thread not found" 
      });
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Add user message
    thread.messages.push({
      role: "user",
      content: message.trim()
    });

    const conversationHistory = thread.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get AI response
    const assistantReply = await getGroqAPIResponse(conversationHistory);

    // Stream response in chunks
    const words = assistantReply.split(" ");
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ chunk: words[i] + " " })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Save to database
    thread.messages.push({
      role: "assistant",
      content: assistantReply
    });
    thread.updatedAt = new Date();
    await thread.save();

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("❌ Streaming error:", err);
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
});

// ✅ Clear all messages in a thread
router.delete("/thread/:threadId/messages", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOneAndUpdate(
      { threadId },
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