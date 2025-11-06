import express from "express";
import Thread from "../models/Thread.js";

const router = express.Router();

// 🧠 Helper function — call Groq API instead of OpenAI
const getGroqAPIResponse = async (message) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b", // Groq model
        messages: [
          { role: "system", content: "You are SamvaadGPT — a helpful and friendly assistant built by Satyam." },
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "No response received.";
  } catch (err) {
    console.error("Groq API Error:", err);
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



// ✅ Get all threads
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    res.json(threads);
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

    res.json(thread.messages);
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
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      // Create new thread
      thread = new Thread({
        threadId,
        title: message,
        messages: [{ role: "user", content: message }],
      });
    } else {
      // Append new user message
      thread.messages.push({ role: "user", content: message });
    }

    // Get AI response from Groq
    const assistantReply = await getGroqAPIResponse(message);

    // Add AI reply to thread
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();

    // Save thread
    await thread.save();

    res.json({ reply: assistantReply });
  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
