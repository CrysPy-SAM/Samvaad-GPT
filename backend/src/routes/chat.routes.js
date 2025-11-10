import express from "express";
import { chatController } from "../controllers/chatController.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import { validateChatMessage } from "../middleware/validator.js";

const router = express.Router();

// ✅ All thread routes require login
router.get("/threads", authMiddleware, chatController.getThreads);
router.get("/thread/:threadId", authMiddleware, chatController.getThread);
router.post("/thread", authMiddleware, chatController.createThread);
router.patch("/thread/:threadId", authMiddleware, chatController.updateThread);
router.delete("/thread/:threadId", authMiddleware, chatController.deleteThread);
router.delete("/thread/:threadId/messages", authMiddleware, chatController.clearMessages);

// ✅ Chat route allows both guest and authenticated users
router.post("/chat", optionalAuth, validateChatMessage, chatController.sendMessage);

// 🆕 Model management routes
router.get("/models", optionalAuth, chatController.getAvailableModels);
router.patch("/preferences/model", authMiddleware, chatController.updateModelPreference);

export default router;