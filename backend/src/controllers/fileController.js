import { fileService } from "../services/fileService.js";
import { ApiError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const fileController = {
  analyzeFile: async (req, res, next) => {
    let filePath = null;

    try {
      if (!req.file) {
        throw new ApiError(400, "No file uploaded");
      }

      filePath = req.file.path;
      const fileType = req.file.mimetype;
      const filename = req.file.originalname;

      logger.info(`Processing file: ${filename} (${fileType})`);

      // Extract content based on file type
      const { content, method } = await fileService.extractContent(
        filePath,
        fileType,
        filename
      );

      if (!content || content.trim().length === 0) {
        throw new ApiError(400, "File appears to be empty or unreadable");
      }

      // Get metadata
      const metadata = fileService.getMetadata(req.file, content.length);

      // Analyze using AI
      const analysis = await fileService.analyzeWithAI(
        content,
        filename,
        method
      );

      // Cleanup
      await fileService.cleanup(filePath);

      res.status(200).json({
        success: true,
        analysis,
        metadata,
        extractionMethod: method,
        contentPreview:
          content.slice(0, 500) + (content.length > 500 ? "..." : ""),
      });
    } catch (err) {
      if (filePath) {
        await fileService.cleanup(filePath);
      }
      next(err);
    }
  },

  getFileInfo: async (req, res, next) => {
    let filePath = null;

    try {
      if (!req.file) {
        throw new ApiError(400, "No file uploaded");
      }

      filePath = req.file.path;
      const metadata = fileService.getMetadata(req.file, 0);

      await fileService.cleanup(filePath);

      res.status(200).json({
        success: true,
        metadata,
      });
    } catch (err) {
      if (filePath) {
        await fileService.cleanup(filePath);
      }
      next(err);
    }
  },
};
