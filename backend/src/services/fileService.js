import fs from "fs/promises";
import Tesseract from "tesseract.js";
import { groqService } from "./groqService.js";
import { ApiError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const fileService = {
  extractContent: async (filePath, fileType, filename) => {
    try {
      // 📘 PDF Files
      if (fileType === "application/pdf") {
        try {
          const pdf = (await import("pdf-parse")).default;
          const dataBuffer = await fs.readFile(filePath);
          const pdfData = await pdf(dataBuffer);
          const text = pdfData.text?.trim() || "";
          if (text.length === 0) {
            logger.warn(`⚠️ PDF appears empty: ${filename}`);
            throw new ApiError(400, "PDF contains no readable text");
          }
          return { content: text, method: "PDF Parser" };
        } catch (err) {
          logger.error("❌ PDF parsing error:", err.message);
          throw new ApiError(400, "Unable to extract text from PDF");
        }
      }

      // 📄 Text-based Files
      if (
        fileType.startsWith("text/") ||
        fileType.includes("javascript") ||
        fileType.includes("json") ||
        fileType.includes("python") ||
        fileType.includes("markdown")
      ) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          if (!content || content.trim().length === 0) {
            throw new ApiError(400, "Text file appears empty");
          }
          return { content, method: "Text Reader" };
        } catch (err) {
          logger.error("❌ Text extraction error:", err.message);
          throw new ApiError(400, "Unable to read text file");
        }
      }

      // 🖼️ Image Files (OCR)
      if (fileType.startsWith("image/")) {
        try {
          logger.info(`🧠 Performing OCR on image: ${filename}`);

          const { data } = await Tesseract.recognize(filePath, "eng", {
            logger: (info) => {
              if (info.status === "recognizing text") {
                logger.debug(
                  `OCR Progress: ${Math.round(info.progress * 100)}%`
                );
              }
            },
          });

          const text = data.text?.trim() || "";
          if (text.length === 0) {
            logger.warn("⚠️ OCR returned no readable text.");
            return {
              content: "⚠️ No readable text detected in the image.",
              method: "OCR (Empty)",
            };
          }

          logger.success(`✅ OCR extraction successful for ${filename}`);
          return { content: text, method: "OCR (Tesseract)" };
        } catch (err) {
          logger.error("❌ OCR Error:", err.message);
          throw new ApiError(400, "Failed to process image text. Try clearer image.");
        }
      }

      // ❌ Unsupported File Types
      throw new ApiError(
        400,
        "Unsupported file type. Please upload: PDF, TXT, JS, JSON, PY, MD, CSV, or image files"
      );
    } catch (err) {
      logger.error("File extraction error:", err);
      throw err;
    }
  },

  // 🤖 AI-Based File Analysis
  analyzeWithAI: async (content, filename, method) => {
    try {
      const messages = [
        {
          role: "user",
          content: `📄 Analyze this file: **${filename}** (extracted via ${method})

Please provide a comprehensive analysis with the following structure:

### 📋 File Overview
- Quick summary of what this file contains

### 🎯 Key Points
- Main topics or functionalities (use bullet points with ✅)

### 💡 Detailed Insights
- Important details, patterns, or notable elements
- Use emojis to highlight different types of content:
  - 💻 for code-related insights
  - 📊 for data/statistics
  - ⚠️ for warnings or issues
  - ✨ for highlights or best practices

### 🔍 Analysis
- Quality assessment
- Potential improvements or suggestions
- Any errors or issues found

### 🚀 Recommendations
- Actionable next steps (if applicable)

**File Content:**
\`\`\`
${content.slice(0, 8000)}
\`\`\`

Format your response exactly like ChatGPT with rich emojis, proper headings, and engaging content!`,
        },
      ];

      const systemPrompt = `You are SamvaadGPT — an advanced AI assistant created by Satyam Mishra, specialized in file analysis. 

Provide comprehensive, ChatGPT-style analysis with:
- 📝 Rich formatting with emojis throughout
- 🎯 Clear section headings with ###
- ✅ Bullet points with relevant emojis
- 💡 Actionable insights and recommendations
- 🔧 Technical accuracy with friendly tone
- ⚡ Highlight key points with **bold**
- 📊 Use tables for comparisons when needed

Make every response engaging, informative, and visually appealing!`;

      const aiResponse = await groqService.getAIResponse(messages, systemPrompt);

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new ApiError(500, "AI returned an empty response");
      }

      return aiResponse;
    } catch (err) {
      logger.error("AI analysis error:", err.message);
      return "⚠️ File analysis service is temporarily unavailable. Please try again later.";
    }
  },

  // 📦 Metadata
  getMetadata: (file, contentLength) => {
    return {
      filename: file.originalname,
      size: file.size,
      sizeFormatted: fileService.formatBytes(file.size),
      type: file.mimetype,
      contentLength,
      uploadedAt: new Date().toISOString(),
    };
  },

  // 🔢 File Size Formatter
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  // 🧹 Cleanup temporary files
  cleanup: async (filePath) => {
    try {
      await fs.unlink(filePath);
      logger.debug(`🧹 File cleaned up: ${filePath}`);
    } catch (err) {
      logger.warn(`⚠️ Failed to delete file: ${filePath}`, err.message);
    }
  },
};
