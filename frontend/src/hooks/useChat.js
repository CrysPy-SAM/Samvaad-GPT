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

  // ✅ Clear all chat data when user logs out or switches to guest mode
  useEffect(() => {
    if (isGuest) {
      setThreads([]);
      setMessages([]);
      setCurrentThreadId(null);
      setError(null);
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
      const data = await chatAPI.getThread(threadId);
      setCurrentThreadId(threadId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading thread:", err);
    }
  }, []);

  const createThread = useCallback(async (title) => {
    try {
      setError(null);
      const data = await chatAPI.createThread(title);
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

  const sendMessage = useCallback(
    async (message) => {
      try {
        setError(null);
        setIsLoading(true);

        let threadId = currentThreadId;
        if (!isGuest && !threadId) {
          threadId = await createThread();
        }

        const data = await chatAPI.sendMessage(threadId, message, isGuest);

        if (data.success) {
          setMessages((prev) => [...prev, data.message]);
          if (!isGuest) await fetchThreads();
        }

        return data;
      } catch (err) {
        setError(err.message);
        console.error("Error sending message:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentThreadId, isGuest, createThread, fetchThreads]
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
    clearChat,
  };
};
