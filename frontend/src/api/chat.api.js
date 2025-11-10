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

  createThread: async (title = "New Chat", modelMode = "fast") => {
    const response = await apiClient.post("/chat/thread", { title, modelMode });
    return response.data;
  },

  updateThread: async (threadId, title, modelMode) => {
    const response = await apiClient.patch(`/chat/thread/${threadId}`, { 
      title, 
      modelMode 
    });
    return response.data;
  },

  deleteThread: async (threadId) => {
    const response = await apiClient.delete(`/chat/thread/${threadId}`);
    return response.data;
  },

sendMessage: async (message, modelMode = "fast", threadId = null, isGuest = true) => {
  const response = await apiClient.post("/chat/chat", {
    threadId,
    message,
    isGuest,
    modelMode,
  });
  return response.data;
},


  clearMessages: async (threadId) => {
    const response = await apiClient.delete(`/chat/thread/${threadId}/messages`);
    return response.data;
  },

  getAvailableModels: async () => {
    const response = await apiClient.get("/chat/models");
    return response.data;
  },

  updateModelPreference: async (modelMode) => {
    const response = await apiClient.patch("/chat/preferences/model", { 
      modelMode 
    });
    return response.data;
  },
};