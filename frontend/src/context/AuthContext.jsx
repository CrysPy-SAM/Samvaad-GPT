import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setIsGuest(false);
    } else {
      setIsGuest(true);
    }
  }, []);

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    setIsGuest(false);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    
    // Clear guest data after successful login
    localStorage.removeItem("guestMessages");
    localStorage.removeItem("guestChatCount");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
    
    // Clear all stored data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("guestMessages");
    localStorage.removeItem("guestChatCount");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);