import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Trash2,
  Menu,
  X,
  Upload,
  Loader2,
  MessageSquare,
  Moon,
  Sun,
  Lock,
} from "lucide-react";

const API_URL = "http://localhost:8080/api";
const GUEST_CHAT_LIMIT = 5;

// Simple AuthContext implementation
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(true);

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
    localStorage.removeItem("guestMessages");
    localStorage.removeItem("guestChatCount");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
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

const useAuth = () => React.useContext(AuthContext);

// Combined Login + Register Popup
const LoginPopup = ({ onClose }) => {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint =
      mode === "login"
        ? "http://localhost:8080/api/auth/login"
        : "http://localhost:8080/api/auth/register";

    const body =
      mode === "register"
        ? { name, email, password }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${mode} failed`);

      // For both login & register → save token + user
      login({ user: data.user, token: data.token });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 text-white p-6 rounded-xl w-80 space-y-4 shadow-xl border border-gray-700"
      >
        <h2 className="text-xl font-bold text-center">
          {mode === "login" ? "Login to Continue" : "Create an Account"}
        </h2>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {mode === "register" && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 focus:outline-none"
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 focus:outline-none"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 focus:outline-none"
          required
        />

        <div className="flex justify-between items-center mt-2">
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            {mode === "login" ? "Login" : "Register"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="text-center mt-3">
          {mode === "login" ? (
            <p className="text-sm text-gray-400">
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-blue-400 hover:underline"
              >
                Register
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-blue-400 hover:underline"
              >
                Login
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};


// Main App Component
function App() {
  const { user, token, logout, isGuest } = useAuth();
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isGuest) {
      const savedMessages = localStorage.getItem("guestMessages");
      const savedCount = localStorage.getItem("guestChatCount");
      
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      if (savedCount) {
        setGuestChatCount(parseInt(savedCount));
      }
    }
  }, [isGuest]);

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem("guestMessages", JSON.stringify(messages));
    }
  }, [messages, isGuest]);

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem("guestChatCount", guestChatCount.toString());
    }
  }, [guestChatCount, isGuest]);

  useEffect(() => {
    if (!isGuest && token) fetchThreads();
  }, [token, isGuest]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [inputMessage]);

  const fetchThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    }
  };

  const createNewThread = async () => {
    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/chat/thread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await response.json();
      setCurrentThreadId(data.threadId);
      setMessages([]);
      fetchThreads();
      return data.threadId;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  };

  const loadThread = async (threadId) => {
    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/chat/thread/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCurrentThreadId(threadId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading thread:", error);
    }
  };

  const deleteThread = async (threadId, e) => {
    e.stopPropagation();
    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await fetch(`${API_URL}/chat/thread/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
        setMessages([]);
      }
      fetchThreads();
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (isGuest && guestChatCount >= GUEST_CHAT_LIMIT) {
      setShowLoginPopup(true);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    const tempUserMsg = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    if (isGuest) {
      setIsLoading(true);
      
      const newCount = guestChatCount + 1;
      setGuestChatCount(newCount);

      setTimeout(() => {
        let responseContent = "";
        const remaining = GUEST_CHAT_LIMIT - newCount;

        if (newCount >= GUEST_CHAT_LIMIT) {
          responseContent = `🔒 You've reached your guest chat limit (${GUEST_CHAT_LIMIT} messages). Please log in or register to continue chatting with unlimited access!`;
        } else if (newCount >= GUEST_CHAT_LIMIT - 1) {
          responseContent = `👋 Hi! I'm SamvaadGPT. This is your last guest message! Please log in or register to continue unlimited conversations. (${remaining} message${remaining !== 1 ? 's' : ''} remaining)`;
        } else if (newCount >= GUEST_CHAT_LIMIT - 2) {
          responseContent = `Hello! I'm SamvaadGPT, created by Satyam Mishra. You have ${remaining} guest message${remaining !== 1 ? 's' : ''} remaining. Log in to unlock unlimited chats, save history, and upload files!`;
        } else {
          responseContent = `👋 Welcome to SamvaadGPT! I'm your AI assistant. Note: Guest users are limited to ${GUEST_CHAT_LIMIT} messages. You have ${remaining} message${remaining !== 1 ? 's' : ''} remaining. Please log in for unlimited access!`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responseContent,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);

        if (newCount >= GUEST_CHAT_LIMIT - 1) {
          setShowLimitWarning(true);
        }

        if (newCount >= GUEST_CHAT_LIMIT) {
          setTimeout(() => setShowLoginPopup(true), 1000);
        }
      }, 1000);

      return;
    }

    setIsLoading(true);
    let threadId = currentThreadId;
    if (!threadId) threadId = await createNewThread();

    try {
      const response = await fetch(`${API_URL}/chat/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId,
          message: userMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        fetchThreads();
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Failed to send message. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isGuest) {
      setShowLoginPopup(true);
      fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/file/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (!currentThreadId) await createNewThread();

        const fileMsg = {
          role: "assistant",
          content: `📄 **File Analysis: ${file.name}**\n\n${data.analysis}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fileMsg]);
        fetchThreads();
      } else throw new Error(data.message || "Failed to analyze file");
    } catch (error) {
      console.error("Error analyzing file:", error);
      const errorMsg = {
        role: "assistant",
        content: `⚠️ Failed to analyze file: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearGuestChat = () => {
    setMessages([]);
    setGuestChatCount(0);
    localStorage.removeItem("guestMessages");
    localStorage.removeItem("guestChatCount");
    setShowLimitWarning(false);
  };

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } overflow-hidden`}
    >
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-0"
        } ${
          darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
        } border-r transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={createNewThread}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            } transition-colors font-medium`}
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {isGuest && (
          <div className="p-4">
            <div className={`${
              darkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-300"
            } border rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className={darkMode ? "text-blue-400" : "text-blue-600"} />
                <span className={`text-sm font-semibold ${
                  darkMode ? "text-blue-300" : "text-blue-700"
                }`}>
                  Guest Mode
                </span>
              </div>
              <p className={`text-xs ${
                darkMode ? "text-blue-200" : "text-blue-600"
              }`}>
                {guestChatCount}/{GUEST_CHAT_LIMIT} messages used
              </p>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(guestChatCount / GUEST_CHAT_LIMIT) * 100}%` }}
                />
              </div>
              {guestChatCount > 0 && (
                <button
                  onClick={clearGuestChat}
                  className={`mt-3 w-full text-xs px-2 py-1 rounded ${
                    darkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 ? (
            <div
              className={`text-center py-8 ${
                darkMode ? "text-gray-600" : "text-gray-400"
              }`}
            >
              <p className="text-sm">
                {isGuest ? "Login to save chats" : "No chats yet"}
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.threadId}
                onClick={() => loadThread(thread.threadId)}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                  currentThreadId === thread.threadId
                    ? darkMode
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-100"
                }`}
              >
                <MessageSquare
                  size={16}
                  className={darkMode ? "text-gray-400" : "text-gray-600"}
                />
                <span
                  className={`flex-1 truncate text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {thread.title}
                </span>
                <button
                  onClick={(e) => deleteThread(thread.threadId, e)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                    darkMode
                      ? "hover:bg-gray-700 text-gray-400 hover:text-red-400"
                      : "hover:bg-gray-200 text-gray-600 hover:text-red-600"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div
          className={`p-4 border-t ${
            darkMode ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } transition-colors`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm">
              {darkMode ? "Light" : "Dark"} Mode
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className={`${
            darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
          } border-b px-4 py-3 flex items-center justify-between flex-shrink-0`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              } transition-colors`}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Samvaad-GPT
              </h1>
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Built by Satyam Mishra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              👋 {isGuest ? "Guest" : user?.name}
            </span>
            {isGuest ? (
              <button
                onClick={() => setShowLoginPopup(true)}
                className={`text-sm px-3 py-1 rounded ${
                  darkMode
                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } transition-colors`}
              >
                Login
              </button>
            ) : (
              <button
                onClick={logout}
                className={`text-sm px-3 py-1 rounded ${
                  darkMode
                    ? "bg-red-700 hover:bg-red-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                } transition-colors`}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {isGuest && showLimitWarning && guestChatCount < GUEST_CHAT_LIMIT && (
          <div className={`${
            darkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-300"
          } border-b px-4 py-2 flex items-center justify-between`}>
            <p className={`text-sm ${
              darkMode ? "text-yellow-200" : "text-yellow-800"
            }`}>
              ⚠️ You have {GUEST_CHAT_LIMIT - guestChatCount} message{GUEST_CHAT_LIMIT - guestChatCount !== 1 ? 's' : ''} remaining. Login for unlimited access!
            </p>
            <button
              onClick={() => setShowLimitWarning(false)}
              className={`text-sm ${
                darkMode ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-700 hover:text-yellow-900"
              }`}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div
                className={`text-6xl mb-4 ${
                  darkMode ? "text-gray-700" : "text-gray-300"
                }`}
              >
                💬
              </div>
              <h2
                className={`text-2xl font-bold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Start a Conversation
              </h2>
              <p
                className={`${
                  darkMode ? "text-gray-500" : "text-gray-500"
                } text-center max-w-md px-4`}
              >
                Ask me anything! I can help with coding, writing, analysis, and
                more.
              </p>
              {isGuest && (
                <div className={`mt-4 px-4 py-2 rounded-lg ${
                  darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}>
                  <p className="text-sm">
                    🎯 Guest Mode: {GUEST_CHAT_LIMIT} free messages • Login for unlimited access
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        darkMode ? "bg-blue-600" : "bg-blue-500"
                      } text-white flex-shrink-0 font-bold text-sm`}
                    >
                      AI
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === "user"
                          ? darkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                          : darkMode
                          ? "bg-gray-800 text-gray-100"
                          : "bg-white text-gray-900 border border-gray-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                    {msg.timestamp && (
                      <span
                        className={`text-xs ${
                          darkMode ? "text-gray-600" : "text-gray-500"
                        } ${
                          msg.role === "user" ? "text-right" : "text-left"
                        } px-2`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-700"
                      } flex-shrink-0 font-semibold text-xs`}
                    >
                      You
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      darkMode ? "bg-blue-600" : "bg-blue-500"
                    } text-white font-bold text-sm`}
                  >
                    AI
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      darkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-white border border-gray-200 text-gray-600"
                    } flex items-center gap-2`}
                  >
                    <Loader2 className="animate-spin" size={20} />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div
          className={`${
            darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
          } border-t px-4 py-4 flex-shrink-0`}
        >
          <div className="max-w-3xl mx-auto">
            {isAnalyzing && (
              <div
                className={`mb-3 flex items-center gap-2 px-4 py-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-800 text-gray-300"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Analyzing file...</span>
              </div>
            )}
            <div
              className={`flex gap-2 items-end ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              } rounded-2xl p-2`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.txt,.js,.json,.py,.jpg,.jpeg,.png,.md,.csv"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || isLoading || (isGuest && guestChatCount >= GUEST_CHAT_LIMIT)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
                    : "hover:bg-gray-200 text-gray-600 hover:text-gray-700"
                } disabled:opacity-50 transition-colors`}
                title={isGuest ? "Login to upload files" : "Upload file"}
              >
                <Upload size={20} />
              </button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  isGuest && guestChatCount >= GUEST_CHAT_LIMIT
                    ? "Please login to continue chatting..."
                    : "Message Samvaad-GPT..."
                }
                disabled={isLoading || isAnalyzing || (isGuest && guestChatCount >= GUEST_CHAT_LIMIT)}
                className={`flex-1 bg-transparent ${
                  darkMode
                    ? "text-white placeholder-gray-500"
                    : "text-gray-900 placeholder-gray-400"
                } outline-none resize-none max-h-32 py-2 px-2`}
                rows={1}
                style={{ minHeight: "24px" }}
              />
              <button
                onClick={sendMessage}
                disabled={
                  !inputMessage.trim() || 
                  isLoading || 
                  isAnalyzing || 
                  (isGuest && guestChatCount >= GUEST_CHAT_LIMIT)
                }
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim() && !isLoading && !isAnalyzing && !(isGuest && guestChatCount >= GUEST_CHAT_LIMIT)
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    : darkMode
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-200 text-gray-400"
                } disabled:cursor-not-allowed`}
              >
                <Send size={20} />
              </button>
            </div>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-600" : "text-gray-500"
              } mt-2 text-center`}
            >
              {isGuest && `Guest: ${guestChatCount}/${GUEST_CHAT_LIMIT} messages used • `}
              Samvaad-GPT can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </div>
      </div>

      {showLoginPopup && (
        <LoginPopup onClose={() => setShowLoginPopup(false)} />
      )}
    </div>
  );
}

// Wrap App with AuthProvider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}