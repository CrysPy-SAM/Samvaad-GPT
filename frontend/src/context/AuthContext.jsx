import { createContext, useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../utils/constants";
import { authAPI } from "../api/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  // ✅ Handle logout: server invalidation + client purge + audio cleanup
  const logout = useCallback(async () => {
    // 1. Invalidate session on server
    try {
      await authAPI.logout();
    } catch (e) {
      // Non-blocking
    }

    // 2. Cancel any running speech synthesis immediately
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Safe ignore
      }
    }

    // 3. Clear all authentication and conversation storage
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GUEST_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.GUEST_COUNT);

    // 4. Update memory state
    setUser(null);
    setToken(null);
    setIsGuest(true);

    // 5. Notify all listeners (useChat, App) to abort in-flight requests & clear state
    window.dispatchEvent(new Event("auth:logout"));
  }, []);

  // ✅ Load saved user/token from localStorage when app starts
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        setIsGuest(false);
      } catch {
        logout();
      }
    } else {
      setIsGuest(true);
    }

    setLoading(false);

    // Listen for session expired events from axios interceptor
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener("auth:session_expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session_expired", handleSessionExpired);
    };
  }, [logout]);

  // ✅ Handle login
  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    setIsGuest(false);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

    // Clear guest session data
    localStorage.removeItem(STORAGE_KEYS.GUEST_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.GUEST_COUNT);

    window.dispatchEvent(new Event("auth:login"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isGuest,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
