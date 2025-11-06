import express from "express";
import Thread from "../models/Thread.js";
import "dotenv/config";

const router = express.Router();

// 🧠 Helper function — call Groq API (corrected)
const getGroqAPIResponse = async (message) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ Correct model name
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are SamvaadGPT — a friendly and intelligent assistant built by Satyam. Respond clearly and naturally.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const data = await response.json();
    console.log("🔍 Groq API response:", JSON.stringify(data, null, 2));

    // 🧠 Handle API errors explicitly
    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return `⚠️ Groq API Error: ${data.error.message || "Unknown issue"}`;
    }

    // ✅ Return AI reply
    return data?.choices?.[0]?.message?.content?.trim() ||
           "⚠️ I’m having trouble generating a response right now.";
  } catch (err) {
    console.error("❌ Groq API Error:", err);
    return "⚠️ Something went wrong while fetching AI response.";
  }
};

// ✅ Test route — verify MongoDB connection
router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "abc",
      title: "Testing new thread",
    });

    const response = await thread.save();
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save in DB" });
  }
});

// ✅ Get all threads (sorted by most recent)
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    res.status(200).json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// ✅ Get specific thread by ID
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json(thread.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chat" });
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

    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// ✅ Chat endpoint — send message and get Groq reply
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields: threadId or message" });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      // Create a new thread if not found
      thread = new Thread({
        threadId,
        title: message.slice(0, 50), // limit title length
        messages: [{ role: "user", content: message }],
      });
    } else {
      // Append new user message
      thread.messages.push({ role: "user", content: message });
    }

    // Get AI response from Groq
    const assistantReply = await getGroqAPIResponse(message);

    // Add assistant reply
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();

    await thread.save();

    res.status(200).json({ reply: assistantReply });
  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({ error: "Something went wrong while processing chat" });
  }
});

export default router;
