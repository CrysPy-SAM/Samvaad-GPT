import apiClient from "./client";

export const fileAPI = {
  analyzeFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/file/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getFileInfo: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/file/info", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
