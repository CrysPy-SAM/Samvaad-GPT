import apiClient from "./client";

export const authAPI = {
  register: async (data) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  login: async (data) => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  sendOTP: async (phone, name) => {
  const response = await apiClient.post("/auth/send-otp", { phone, name });
  return response.data;
},


  verifyOTP: async (phone, otp, name) => {
    const response = await apiClient.post("/auth/verify-otp", { phone, otp, name });
    return response.data;
  },
};