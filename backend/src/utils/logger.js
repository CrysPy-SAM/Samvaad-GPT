import "dotenv/config";

/**
 * Fetches an AI-generated reply from Groq's LLaMA model.
 * @param {string} message - The user's input message.
 * @returns {Promise<string>} - The assistant's response.
 */
const getGroqAPIResponse = async (message) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // ✅ Correct and active Groq model
        messages: [
          {
            role: "system",
            content:
              "You are SamvaadGPT — a friendly, creative, and helpful assistant built by Satyam. Answer naturally and clearly.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const data = await response.json();

    // 🧠 Log API response (for debugging)
    console.log("🔍 Groq API raw response:", JSON.stringify(data, null, 2));

    // 🛑 If there's an error in the API response
    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return `⚠️ Groq API Error: ${data.error.message || "Unknown issue occurred."}`;
    }

    // ✅ If we received a valid assistant message
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply) return reply;

    // ❗ If Groq returns an unexpected format
    return "⚠️ I’m having trouble generating a response right now.";
  } catch (err) {
    console.error("❌ Network or Server Error:", err);
    return "⚠️ Something went wrong while contacting the Groq API.";
  }
};

export default getGroqAPIResponse;
x``