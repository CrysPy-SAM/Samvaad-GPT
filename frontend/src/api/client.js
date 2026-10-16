import axios from "axios";
import { APP_CONFIG, STORAGE_KEYS } from "../utils/constants";

const apiClient = axios.create({
  baseURL: APP_CONFIG.API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.GUEST_MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.GUEST_COUNT);
      window.dispatchEvent(new Event("auth:session_expired"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;