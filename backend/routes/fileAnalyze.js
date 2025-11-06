import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";
import Tesseract from "tesseract.js";

const router = express.Router();

// 📁 Configure multer with file size limits and type filtering
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/javascript",
      "application/javascript",
      "application/json",
      "text/x-python",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "text/markdown"
    ];

    if (allowedTypes.includes(file.mimetype) || 
        file.mimetype.startsWith("text/") ||
        file.mimetype.includes("javascript") ||
        file.mimetype.includes("python")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});

// ✅ Dynamically import pdf-parse
const loadPdfParse = async () => {
  const pdf = (await import("pdf-parse")).default;
  return pdf;
};

// 🧠 Helper — Analyze file content using Groq API
const getGroqFileAnalysis = async (content, filename, fileType) => {
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
            content: `You are SamvaadGPT — an advanced AI assistant created by Satyam Mishra, specialized in file analysis and content understanding. Provide comprehensive, structured analysis with key insights, summaries, and actionable information.`,
          },
          {
            role: "user",
            content: `Analyze this ${fileType} file named "${filename}". Provide:
1. Brief summary (2-3 sentences)
2. Key points or main topics
3. Important details or insights
4. Any issues, errors, or suggestions (if applicable)

File content:
${content.slice(0, 8000)}` // Limit content to avoid token limits
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return `⚠️ Analysis failed: ${data.error.message}`;
    }

    return data?.choices?.[0]?.message?.content?.trim() || 
           "⚠️ Unable to generate analysis.";
  } catch (err) {
    console.error("❌ Groq API Error:", err.message);
    return "⚠️ File analysis service is temporarily unavailable.";
  }
};

// 📊 Extract metadata from file
const extractMetadata = (file, contentLength) => {
  return {
    filename: file.originalname,
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    type: file.mimetype,
    contentLength,
    uploadedAt: new Date().toISOString()
  };
};

// 🔧 Format bytes to human readable
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// 🧹 Cleanup function
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error("⚠️ Failed to delete file:", filePath, err.message);
  }
};

// ✅ Route — Upload & Analyze File
router.post("/analyze", upload.single("file"), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded",
        message: "Please attach a file to analyze" 
      });
    }

    filePath = req.file.path;
    const fileType = req.file.mimetype;
    const filename = req.file.originalname;
    let fileContent = "";
    let extractionMethod = "";

    console.log(`📂 Processing: ${filename} (${fileType})`);

    // 📄 Handle PDF
    if (fileType === "application/pdf") {
      extractionMethod = "PDF Parser";
      const pdf = await loadPdfParse();
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      fileContent = pdfData.text;

      if (!fileContent.trim()) {
        return res.status(400).json({
          error: "Empty PDF",
          message: "The PDF appears to be empty or contains no extractable text"
        });
      }

    // 📝 Handle Text-based files
    } else if (
      fileType.startsWith("text/") ||
      fileType.includes("javascript") ||
      fileType.includes("json") ||
      fileType.includes("python") ||
      fileType.includes("markdown")
    ) {
      extractionMethod = "Text Reader";
      fileContent = await fs.readFile(filePath, "utf-8");

      if (!fileContent.trim()) {
        return res.status(400).json({
          error: "Empty file",
          message: "The file appears to be empty"
        });
      }

    // 🖼️ Handle Images (OCR)
    } else if (fileType.startsWith("image/")) {
      extractionMethod = "OCR (Tesseract)";
      console.log("🔍 Performing OCR on image...");
      
      const { data: { text } } = await Tesseract.recognize(filePath, "eng", {
        logger: info => {
          if (info.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });
      
      fileContent = text.trim();
      
      if (!fileContent) {
        return res.status(400).json({
          error: "No text found",
          message: "No readable text detected in the image. The image may not contain any text or the text quality may be too low."
        });
      }

    // ❌ Unsupported file type
    } else {
      await cleanupFile(filePath);
      return res.status(400).json({
        error: "Unsupported file type",
        message: "Please upload: PDF, TXT, JS, JSON, PY, MD, CSV, or image files (JPG, PNG)"
      });
    }

    // 📊 Extract metadata
    const metadata = extractMetadata(req.file, fileContent.length);

    // 🧠 Analyze using Groq AI
    console.log("🤖 Sending to AI for analysis...");
    const analysis = await getGroqFileAnalysis(fileContent, filename, extractionMethod);

    // 🧹 Cleanup uploaded file
    await cleanupFile(filePath);

    res.status(200).json({
      success: true,
      analysis,
      metadata,
      extractionMethod,
      contentPreview: fileContent.slice(0, 500) + (fileContent.length > 500 ? "..." : "")
    });

  } catch (err) {
    console.error("❌ Error during file analysis:", err);
    
    // Cleanup on error
    if (filePath) {
      await cleanupFile(filePath);
    }

    if (err.message === "Unsupported file type") {
      return res.status(400).json({
        error: "Unsupported file type",
        message: err.message
      });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "Maximum file size is 10MB"
      });
    }

    res.status(500).json({
      error: "Analysis failed",
      message: "An error occurred while processing your file"
    });
  }
});

// 🔍 Route — Quick file info (without AI analysis)
router.post("/info", upload.single("file"), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    filePath = req.file.path;
    const metadata = extractMetadata(req.file, 0);

    await cleanupFile(filePath);

    res.status(200).json({
      success: true,
      metadata
    });

  } catch (err) {
    console.error("❌ Error getting file info:", err);
    
    if (filePath) {
      await cleanupFile(filePath);
    }

    res.status(500).json({
      error: "Failed to process file information"
    });
  }
});

export default router;