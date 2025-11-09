import { createContext, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../utils/constants";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setIsGuest(false);
    } else {
      setIsGuest(true);
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    setIsGuest(false);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    
    // Clear guest data
    localStorage.removeItem(STORAGE_KEYS.GUEST_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.GUEST_COUNT);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
    
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GUEST_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.GUEST_COUNT);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
};