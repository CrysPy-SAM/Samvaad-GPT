import { useState, useCallback, useEffect, useRef } from "react";
import { chatAPI } from "../api/chat.api";
import { useAuth } from "./useAuth";

export const useChat = () => {
  const { isGuest } = useAuth();
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // 🧹 Robust event listener for immediate session cleanup on logout / expiration
  useEffect(() => {
    const handleLogoutCleanup = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setThreads([]);
      setMessages([]);
      setCurrentThreadId(null);
      setIsLoading(false);
      setError(null);
    };

    window.addEventListener("auth:logout", handleLogoutCleanup);
    window.addEventListener("auth:session_expired", handleLogoutCleanup);

    return () => {
      window.removeEventListener("auth:logout", handleLogoutCleanup);
      window.removeEventListener("auth:session_expired", handleLogoutCleanup);
    };
  }, []);

  // 🔄 Handle guest vs logged-in state transitions cleanly
  useEffect(() => {
    // Whenever auth state switches, reset the active conversation and abort ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setCurrentThreadId(null);
    setError(null);
    setIsLoading(false);

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

  // 💬 Send message with optimistic update, abort controller, & auto-thread association
  const sendMessage = useCallback(
    async (message, modelMode = "fast") => {
      if (!message || !message.trim()) return null;

      // Abort any existing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

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

        // Send to backend with cancellation signal
        const data = await chatAPI.sendMessage(
          trimmedMsg,
          modelMode,
          currentThreadId,
          isGuest,
          controller.signal
        );

        // Check if aborted before applying state
        if (controller.signal.aborted) {
          return null;
        }

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
        // If aborted intentionally (e.g. user logged out or navigated), do not treat as error
        if (controller.signal.aborted || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return null;
        }

        setError(err.message || "Failed to send message");
        console.error("Error sending message:", err);
        throw err;
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentThreadId(null);
    setMessages([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setThreads([]);
    setMessages([]);
    setCurrentThreadId(null);
    setIsLoading(false);
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
