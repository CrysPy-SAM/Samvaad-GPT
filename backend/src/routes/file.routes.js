import express from "express";
import { fileController } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// All file routes require authentication
router.use(authMiddleware);

router.post("/analyze", upload.single("file"), fileController.analyzeFile);
router.post("/info", upload.single("file"), fileController.getFileInfo);

export default router;