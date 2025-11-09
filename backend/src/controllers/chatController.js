import Thread from "../models/Thread.js";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../utils/response.js";
import { groqService } from "../services/groqService.js";
import { logger } from "../utils/logger.js";

export const chatController = {
  // Get all threads for user
  getThreads: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [threads, total] = await Promise.all([
        Thread.find({ userId })
          .select("threadId title updatedAt createdAt messages")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Thread.countDocuments({ userId }),
      ]);

      const enrichedThreads = threads.map((thread) => ({
        ...thread,
        messageCount: thread.messages?.length || 0,
        lastMessage:
          thread.messages?.[thread.messages.length - 1]?.content.slice(0, 100) ||
          "",
      }));

      res.status(200).json({
        threads: enrichedThreads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Get specific thread
  getThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;

      const thread = await Thread.findOne({ threadId, userId }).lean();

      if (!thread) {
        throw new ApiError(404, "Thread not found");
      }

      res.status(200).json({
        threadId: thread.threadId,
        title: thread.title,
        messages: thread.messages,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // Create new thread
  createThread: async (req, res, next) => {
    try {
      const { title } = req.body;
      const userId = req.user.id;
      const threadId = uuidv4();

      const thread = new Thread({
        threadId,
        title: title || "New Chat",
        messages: [],
        userId,
      });

      await thread.save();

      logger.info(`Thread created: ${threadId} for user: ${userId}`);

      res.status(201).json({
        threadId: thread.threadId,
        title: thread.title,
        createdAt: thread.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // Update thread title
  updateThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      if (!title || title.trim().length === 0) {
        throw new ApiError(400, "Title is required");
      }

      const thread = await Thread.findOneAndUpdate(
        { threadId, userId },
        { title: title.trim(), updatedAt: new Date() },
        { new: true }
      );

      if (!thread) {
        throw new ApiError(404, "Thread not found");
      }

      res.status(200).json({
        threadId: thread.threadId,
        title: thread.title,
        updatedAt: thread.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // Delete thread
  deleteThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;

      const deletedThread = await Thread.findOneAndDelete({ threadId, userId });

      if (!deletedThread) {
        throw new ApiError(404, "Thread not found");
      }

      logger.info(`Thread deleted: ${threadId}`);

      res.status(200).json({
        success: true,
        message: "Thread deleted successfully",
        threadId,
      });
    } catch (err) {
      next(err);
    }
  },

  // Send chat message
  sendMessage: async (req, res, next) => {
    try {
      const { threadId, message, isGuest } = req.body;

      // Guest user flow (no thread, no DB)
      if (isGuest) {
        logger.info("Guest AI Request");
        
        const conversation = [{ role: "user", content: message }];
        const assistantReply = await groqService.getAIResponse(conversation);

        return res.status(200).json({
          success: true,
          message: {
            role: "assistant",
            content: assistantReply,
          },
        });
      }

      // Logged-in user flow
      if (!threadId) {
        throw new ApiError(400, "threadId is required");
      }

      const userId = req.user.id;
      const thread = await Thread.findOne({ threadId, userId });

      if (!thread) {
        throw new ApiError(404, "Thread not found. Please create a thread first.");
      }

      const userMessage = { role: "user", content: message.trim() };
      thread.messages.push(userMessage);

      const conversationHistory = thread.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const assistantReply = await groqService.getAIResponse(conversationHistory);

      const assistantMessage = { role: "assistant", content: assistantReply };
      thread.messages.push(assistantMessage);

      // Auto-generate title from first message
      if (thread.messages.length === 2) {
        thread.title = message.slice(0, 50);
      }

      thread.updatedAt = new Date();
      await thread.save();

      logger.info(`Message sent in thread: ${threadId}`);

      res.status(200).json({
        success: true,
        message: {
          role: "assistant",
          content: assistantReply,
        },
        threadId: thread.threadId,
      });
    } catch (err) {
      next(err);
    }
  },

  // Clear all messages in thread
  clearMessages: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;

      const thread = await Thread.findOneAndUpdate(
        { threadId, userId },
        { messages: [], updatedAt: new Date() },
        { new: true }
      );

      if (!thread) {
        throw new ApiError(404, "Thread not found");
      }

      res.status(200).json({
        success: true,
        message: "All messages cleared",
        threadId,
      });
    } catch (err) {
      next(err);
    }
  },
};