import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(true); // ✅ new state

  // ✅ Load from localStorage
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
  localStorage.removeItem("guestMessages"); // ✅ clear guest chat after login
};

const logout = () => {
  setUser(null);
  setToken(null);
  setIsGuest(true);
  localStorage.clear(); // ✅ full clear is okay
};

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
