import express from "express";
import { fileController } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { fileLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// All file routes require authentication and file rate limiting
router.use(authMiddleware);
router.use(fileLimiter);

router.post("/analyze", upload.single("file"), fileController.analyzeFile);
router.post("/info", upload.single("file"), fileController.getFileInfo);

export default router;