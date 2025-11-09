import apiClient from "./client";

export const chatAPI = {
  getThreads: async (page = 1, limit = 20) => {
    const response = await apiClient.get(`/chat/threads?page=${page}&limit=${limit}`);
    return response.data;
  },

  getThread: async (threadId) => {
    const response = await apiClient.get(`/chat/thread/${threadId}`);
    return response.data;
  },

  createThread: async (title = "New Chat") => {
    const response = await apiClient.post("/chat/thread", { title });
    return response.data;
  },

  updateThread: async (threadId, title) => {
    const response = await apiClient.patch(`/chat/thread/${threadId}`, { title });
    return response.data;
  },

  deleteThread: async (threadId) => {
    const response = await apiClient.delete(`/chat/thread/${threadId}`);
    return response.data;
  },

  sendMessage: async (threadId, message, isGuest = false) => {
    const response = await apiClient.post("/chat/chat", {
      threadId,
      message,
      isGuest,
    });
    return response.data;
  },

  clearMessages: async (threadId) => {
    const response = await apiClient.delete(`/chat/thread/${threadId}/messages`);
    return response.data;
  },
};
