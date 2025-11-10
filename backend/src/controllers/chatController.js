import Thread from "../models/Thread.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../utils/response.js";
import { aiService } from "../services/aiService.js";
import { logger } from "../utils/logger.js";

export const chatController = {
  // ✅ Get all threads for user
  getThreads: async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [threads, total] = await Promise.all([
        Thread.find({ userId })
          .select("threadId title updatedAt createdAt messages settings")
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

  // ✅ Get a specific thread
  getThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const thread = await Thread.findOne({ threadId, userId }).lean();
      if (!thread) throw new ApiError(404, "Thread not found");

      res.status(200).json({
        threadId: thread.threadId,
        title: thread.title,
        messages: thread.messages,
        settings: thread.settings,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // ✅ Create new thread
  createThread: async (req, res, next) => {
    try {
      const { title, modelMode } = req.body;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      // Get user's preferred model
      const user = await User.findById(userId);
      const preferredModel = modelMode || user?.preferences?.aiModel || "fast";

      const threadId = uuidv4();

      const thread = new Thread({
        threadId,
        title: title?.trim() || "New Chat",
        messages: [],
        userId,
        settings: {
          model: preferredModel,
        },
      });

      await thread.save();
      logger.info(`Thread created: ${threadId} with model: ${preferredModel}`);

      res.status(201).json({
        threadId: thread.threadId,
        title: thread.title,
        settings: thread.settings,
        createdAt: thread.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // ✅ Update thread title or settings
  updateThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const { title, modelMode } = req.body;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const updateData = { updatedAt: new Date() };
      
      if (title && title.trim().length > 0) {
        updateData.title = title.trim();
      }
      
      if (modelMode) {
        updateData["settings.model"] = modelMode;
      }

      const thread = await Thread.findOneAndUpdate(
        { threadId, userId },
        updateData,
        { new: true }
      );

      if (!thread) throw new ApiError(404, "Thread not found");

      res.status(200).json({
        threadId: thread.threadId,
        title: thread.title,
        settings: thread.settings,
        updatedAt: thread.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  // ✅ Delete thread
  deleteThread: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const deletedThread = await Thread.findOneAndDelete({ threadId, userId });
      if (!deletedThread) throw new ApiError(404, "Thread not found");

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

  // ✅ Send message (guest + logged-in) with model selection
  sendMessage: async (req, res, next) => {
    try {
      const { threadId, message, isGuest, modelMode } = req.body;
      const userId = req.user?.id || req.user?._id;
      const isAuthenticated = Boolean(userId && !isGuest);

      if (!message || message.trim().length === 0) {
        throw new ApiError(400, "Message content is required");
      }

      // 🌐 Guest Chat Flow
      if (!isAuthenticated) {
        logger.info("Guest AI Request");

        const conversation = [{ role: "user", content: message }];
        const selectedModel = modelMode || "fast";
        const assistantReply = await aiService.getAIResponse(
          conversation,
          selectedModel
        );

        return res.status(200).json({
          success: true,
          message: {
            role: "assistant",
            content: assistantReply,
            timestamp: new Date(),
          },
          modelUsed: selectedModel,
        });
      }

      // 👤 Logged-in Chat Flow
      if (!threadId) {
        throw new ApiError(400, "Thread ID is required");
      }

      const thread = await Thread.findOne({ threadId, userId });
      if (!thread) throw new ApiError(404, "Thread not found. Please create a thread first.");

      // Save user message
      const userMessage = { role: "user", content: message.trim() };
      thread.messages.push(userMessage);

      const conversationHistory = thread.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get model preference (from request, thread, or user)
      let selectedModel = modelMode || thread.settings?.model;
      if (!selectedModel) {
        const user = await User.findById(userId);
        selectedModel = user?.preferences?.aiModel || "fast";
      }

      // Get AI response
      const assistantReply = await aiService.getAIResponse(
        conversationHistory,
        selectedModel
      );
      const assistantMessage = { 
        role: "assistant", 
        content: assistantReply,
        metadata: {
          model: selectedModel,
        }
      };
      thread.messages.push(assistantMessage);

      // Auto title generation
      if (thread.messages.length === 2) {
        thread.title = message.slice(0, 50);
      }

      thread.updatedAt = new Date();
      await thread.save();

      logger.info(`Message sent in thread: ${threadId} using model: ${selectedModel}`);

      res.status(200).json({
        success: true,
        message: {
          role: "assistant",
          content: assistantReply,
        },
        threadId: thread.threadId,
        modelUsed: selectedModel,
      });
    } catch (err) {
      next(err);
    }
  },

  // ✅ Clear all messages in thread
  clearMessages: async (req, res, next) => {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const thread = await Thread.findOneAndUpdate(
        { threadId, userId },
        { messages: [], updatedAt: new Date() },
        { new: true }
      );

      if (!thread) throw new ApiError(404, "Thread not found");

      res.status(200).json({
        success: true,
        message: "All messages cleared",
        threadId,
      });
    } catch (err) {
      next(err);
    }
  },

  // 🆕 Get available AI models
  getAvailableModels: async (req, res, next) => {
    try {
      const models = aiService.getAvailableModels();
      res.status(200).json({
        success: true,
        models,
      });
    } catch (err) {
      next(err);
    }
  },

  // 🆕 Update user's default model preference
  updateModelPreference: async (req, res, next) => {
    try {
      const { modelMode } = req.body;
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      if (!["fast", "creative", "detailed"].includes(modelMode)) {
        throw new ApiError(400, "Invalid model mode");
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { "preferences.aiModel": modelMode },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Model preference updated",
        preference: user.preferences.aiModel,
      });
    } catch (err) {
      next(err);
    }
  },
};