import { useState, useCallback, useEffect } from "react";
import { chatAPI } from "../api/chat.api";
import { useAuth } from "./useAuth";

export const useChat = () => {
  const { isGuest } = useAuth();
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔄 Handle guest vs logged-in state transitions cleanly
  useEffect(() => {
    // Whenever auth state switches, reset the active conversation so no chat leaks
    setMessages([]);
    setCurrentThreadId(null);
    setError(null);

    if (isGuest) {
      setThreads([]);
    } else {
      fetchThreads();
    }
  }, [isGuest]);

  const fetchThreads = useCallback(async () => {
    if (isGuest) return;

    try {
      setError(null);
      const data = await chatAPI.getThreads();
      setThreads(data.threads || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching threads:", err);
    }
  }, [isGuest]);

  const loadThread = useCallback(async (threadId) => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await chatAPI.getThread(threadId);
      setCurrentThreadId(threadId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading thread:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThread = useCallback(async (title = "New Chat", modelMode = "fast") => {
    try {
      setError(null);
      const data = await chatAPI.createThread(title, modelMode);
      setCurrentThreadId(data.threadId);
      setMessages([]);
      await fetchThreads();
      return data.threadId;
    } catch (err) {
      setError(err.message);
      console.error("Error creating thread:", err);
      return null;
    }
  }, [fetchThreads]);

  // 💬 Send message with optimistic update & auto-thread association
  const sendMessage = useCallback(
    async (message, modelMode = "fast") => {
      if (!message || !message.trim()) return null;

      try {
        setError(null);
        setIsLoading(true);

        const trimmedMsg = message.trim();
        const userMsg = {
          role: "user",
          content: trimmedMsg,
          timestamp: new Date().toISOString(),
        };

        // Optimistically add user message to conversation
        setMessages((prev) => [...prev, userMsg]);

        // Send to backend (backend auto-creates thread for logged-in user if currentThreadId is null)
        const data = await chatAPI.sendMessage(
          trimmedMsg,
          modelMode,
          currentThreadId,
          isGuest
        );

        if (data.success && data.message) {
          // Append assistant message
          setMessages((prev) => [...prev, data.message]);

          // If logged-in user and backend created or returned a threadId
          if (!isGuest && data.threadId) {
            if (currentThreadId !== data.threadId) {
              setCurrentThreadId(data.threadId);
            }
            await fetchThreads();
          }
        }

        return data;
      } catch (err) {
        setError(err.message || "Failed to send message");
        console.error("Error sending message:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentThreadId, isGuest, fetchThreads]
  );

  const deleteThread = useCallback(
    async (threadId) => {
      try {
        setError(null);
        await chatAPI.deleteThread(threadId);

        if (currentThreadId === threadId) {
          setCurrentThreadId(null);
          setMessages([]);
        }

        await fetchThreads();
      } catch (err) {
        setError(err.message);
        console.error("Error deleting thread:", err);
      }
    },
    [currentThreadId, fetchThreads]
  );

  const resetChat = useCallback(() => {
    setCurrentThreadId(null);
    setMessages([]);
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    setThreads([]);
    setMessages([]);
    setCurrentThreadId(null);
    setError(null);
  }, []);

  return {
    threads,
    currentThreadId,
    messages,
    isLoading,
    error,
    fetchThreads,
    loadThread,
    createThread,
    sendMessage,
    deleteThread,
    setMessages,
    setCurrentThreadId,
    resetChat,
    clearChat,
  };
};
