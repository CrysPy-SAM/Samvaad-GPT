import fs from "fs/promises";
import Tesseract from "tesseract.js";
import { groqService } from "./groqService.js";
import { ApiError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const fileService = {
  extractContent: async (filePath, fileType, filename) => {
    try {
      // PDF
      if (fileType === "application/pdf") {
        const pdf = (await import("pdf-parse")).default;
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdf(dataBuffer);
        return { content: pdfData.text, method: "PDF Parser" };
      }

      // Text-based files
      if (
        fileType.startsWith("text/") ||
        fileType.includes("javascript") ||
        fileType.includes("json") ||
        fileType.includes("python") ||
        fileType.includes("markdown")
      ) {
        const content = await fs.readFile(filePath, "utf-8");
        return { content, method: "Text Reader" };
      }

      // Images (OCR)
      if (fileType.startsWith("image/")) {
        logger.info("Performing OCR on image...");
        const {
          data: { text },
        } = await Tesseract.recognize(filePath, "eng", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              logger.debug(`OCR Progress: ${Math.round(info.progress * 100)}%`);
            }
          },
        });
        return { content: text.trim(), method: "OCR (Tesseract)" };
      }

      throw new ApiError(
        400,
        "Unsupported file type. Please upload: PDF, TXT, JS, JSON, PY, MD, CSV, or image files"
      );
    } catch (err) {
      logger.error("File extraction error:", err);
      throw err;
    }
  },

  analyzeWithAI: async (content, filename, method) => {
    try {
      const messages = [
        {
          role: "user",
          content: `Analyze this ${method} file named "${filename}". Provide:
1. Brief summary (2-3 sentences)
2. Key points or main topics
3. Important details or insights
4. Any issues, errors, or suggestions (if applicable)

File content:
${content.slice(0, 8000)}`,
        },
      ];

      const systemPrompt =
        "You are SamvaadGPT — an advanced AI assistant created by Satyam Mishra, specialized in file analysis and content understanding. Provide comprehensive, structured analysis with key insights, summaries, and actionable information.";

      return await groqService.getAIResponse(messages, systemPrompt);
    } catch (err) {
      logger.error("AI analysis error:", err);
      return "⚠️ File analysis service is temporarily unavailable.";
    }
  },

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

  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  cleanup: async (filePath) => {
    try {
      await fs.unlink(filePath);
      logger.debug(`File cleaned up: ${filePath}`);
    } catch (err) {
      logger.warn(`Failed to delete file: ${filePath}`, err.message);
    }
  },
};