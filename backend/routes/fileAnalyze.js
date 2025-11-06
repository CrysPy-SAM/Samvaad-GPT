import express from "express";
import multer from "multer";
import fs from "fs";
import "dotenv/config";
import Tesseract from "tesseract.js"; // 👈 Added for OCR support

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Dynamically import pdf-parse
const loadPdfParse = async () => {
  const pdf = (await import("pdf-parse")).default;
  return pdf;
};

// 🧠 Helper — Analyze file content using Groq API
const getGroqFileAnalysis = async (content, filename) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are SamvaadGPT — an intelligent assistant created by Satyam Mishra. 
                      Analyze the uploaded file and summarize it clearly.`,
          },
          {
            role: "user",
            content: `Analyze this file named "${filename}" and summarize:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return `⚠️ Groq API Error: ${data.error.message}`;
    }

    return data?.choices?.[0]?.message?.content?.trim() || "⚠️ No analysis available.";
  } catch (err) {
    console.error("❌ Groq API Error:", err);
    return "⚠️ Something went wrong while analyzing the file.";
  }
};

// ✅ Route — Upload & Analyze File
router.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please attach a file." });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const filename = req.file.originalname;
    let fileContent = "";

    console.log(`📂 Received file: ${filename} (${fileType})`);

    // 🧩 Handle PDF
    if (fileType === "application/pdf") {
      const pdf = await loadPdfParse();
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      fileContent = pdfData.text;

    // 🧩 Handle Text, JS, JSON, Python
    } else if (
      fileType.startsWith("text/") ||
      fileType.includes("javascript") ||
      fileType.includes("json") ||
      fileType.includes("python")
    ) {
      fileContent = fs.readFileSync(filePath, "utf-8");

    // 🧩 Handle Image (JPG, PNG, JPEG)
    } else if (fileType.startsWith("image/")) {
      console.log("🧠 Performing OCR on image...");
      const { data: { text } } = await Tesseract.recognize(filePath, "eng");
      fileContent = text.trim();
      if (!fileContent) fileContent = "⚠️ No readable text detected in image.";

    // ❌ Unsupported file
    } else {
      await fs.promises.unlink(filePath);
      return res.status(400).json({
        error: "Unsupported file type. Please upload .txt, .js, .json, .py, .pdf, or .jpg/.png files only.",
      });
    }

    // 🔍 Analyze using Groq
    const analysis = await getGroqFileAnalysis(fileContent, filename);

    // 🧹 Cleanup uploaded file
    await fs.promises.unlink(filePath);

    res.status(200).json({ analysis });
  } catch (err) {
    console.error("❌ Error during file analysis:", err);
    res.status(500).json({ error: "Failed to process the file." });
  }
});

export default router;
