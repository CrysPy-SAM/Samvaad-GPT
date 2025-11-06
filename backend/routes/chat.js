import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b", // or "llama-3-70b" / "mixtral-8x7b"
        messages: [
          { role: "system", content: "You are SamvaadGPT — a friendly AI assistant built by Satyam." },
          { role: "user", content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 600
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response received.";

    res.json({ reply });
  } catch (err) {
    console.error("Groq API Error:", err);
    res.status(500).json({ error: "Failed to fetch response from Groq API" });
  }
});

export default router;
