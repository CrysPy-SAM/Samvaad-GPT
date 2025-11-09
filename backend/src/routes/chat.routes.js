import express from "express";
import { chatController } from "../controllers/chatController.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import { validateChatMessage } from "../middleware/validator.js";

const router = express.Router();

// All routes except /chat require authentication
router.use((req, res, next) => {
  if (req.path === "/chat") return next();
  return authMiddleware(req, res, next);
});

// Thread Management
router.get("/threads", chatController.getThreads);
router.get("/thread/:threadId", chatController.getThread);
router.post("/thread", chatController.createThread);
router.patch("/thread/:threadId", chatController.updateThread);
router.delete("/thread/:threadId", chatController.deleteThread);
router.delete("/thread/:threadId/messages", chatController.clearMessages);

// Chat (supports both guest and authenticated users)
router.post("/chat", validateChatMessage, chatController.sendMessage);

export default router;