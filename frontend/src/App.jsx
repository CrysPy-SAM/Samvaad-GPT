import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { ChatArea } from "./components/chat/ChatArea";
import { MessageInput } from "./components/chat/MessageInput";
import ModelSelector from "./components/chat/ModelSelector";
import { LoginPopup } from "./components/auth/LoginPopup";
import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useTheme } from "./hooks/useTheme";
import { fileAPI } from "./api/file.api";
import { chatAPI } from "./api/chat.api";
import { APP_CONFIG, STORAGE_KEYS } from "./utils/constants";

function App() {
  // ✅ Auth + Theme Hooks
  const { isGuest, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // ✅ Chat State Management
  const {
    threads,
    currentThreadId,
    messages,
    isLoading,
    fetchThreads,
    loadThread,
    createThread,
    sendMessage,
    deleteThread,
    setMessages,
    setCurrentThreadId,
  } = useChat();

  // ✅ UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ✅ Model Mode
  const [selectedModel, setSelectedModel] = useLocalStorage(
    STORAGE_KEYS.MODEL_MODE,
    "fast"
  );

  // ✅ Guest User Storage
  const [guestMessages, setGuestMessages, clearGuestMessages] = useLocalStorage(
    STORAGE_KEYS.GUEST_MESSAGES,
    []
  );
  const [guestChatCount, setGuestChatCount, clearGuestCount] = useLocalStorage(
    STORAGE_KEYS.GUEST_COUNT,
    0
  );

  // 🧩 Load data based on user type
  useEffect(() => {
    if (isGuest) {
      setMessages(guestMessages);
    } else {
      fetchThreads();
    }
  }, [isGuest]);

  useEffect(() => {
    if (isGuest) {
      setGuestMessages(messages);
    }
  }, [messages, isGuest]);

  // ⚙️ Handle model change
  const handleModelChange = async (modelMode) => {
    setSelectedModel(modelMode);

    if (!isGuest) {
      try {
        await chatAPI.updateModelPreference(modelMode);
      } catch (err) {
        console.error("Failed to update model preference:", err);
      }
    }

    if (currentThreadId && !isGuest) {
      try {
        await chatAPI.updateThread(currentThreadId, null, modelMode);
      } catch (err) {
        console.error("Failed to update thread model:", err);
      }
    }
  };

  // 💬 Send Message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (isGuest && guestChatCount >= APP_CONFIG.GUEST_CHAT_LIMIT) {
      setShowLoginPopup(true);
      return;
    }

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const data = await sendMessage(inputMessage.trim(), selectedModel);
      if (isGuest) {
        setGuestChatCount(guestChatCount + 1);
        if (guestChatCount + 1 >= APP_CONFIG.GUEST_CHAT_LIMIT) {
          setTimeout(() => setShowLoginPopup(true), 1000);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // 📂 Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await fileAPI.analyzeFile(file);
      const fileMsg = {
        role: "assistant",
        content: `📄 **File Analysis: ${file.name}**\n\n${data.analysis}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fileMsg]);
    } catch (err) {
      console.error("File upload error:", err);
      const errorMsg = {
        role: "assistant",
        content: `⚠️ Failed to analyze file: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🆕 Create new chat
  const handleNewChat = async () => {
    if (isGuest) {
      setShowLoginPopup(true);
    } else {
      await createThread("New Chat", selectedModel);
    }
  };

  // 🧹 Clear guest messages
  const handleClearGuestChat = () => {
    setMessages([]);
    clearGuestMessages();
    clearGuestCount();
  };

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } overflow-hidden`}
    >
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "w-64" : "w-0"} ${
          darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
        } border-r transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <Sidebar
          threads={threads}
          currentThreadId={currentThreadId}
          onNewChat={handleNewChat}
          onSelectThread={loadThread}
          onDeleteThread={deleteThread}
          guestChatCount={guestChatCount}
          onClearGuestChat={handleClearGuestChat}
          user={user}
          isGuest={isGuest}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
       <Header
  isSidebarOpen={isSidebarOpen}
  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
  onShowLogin={() => setShowLoginPopup(true)}
  selectedModel={selectedModel}
  onModelChange={handleModelChange}
  darkMode={darkMode}
  toggleTheme={toggleTheme}
  user={user}
  isGuest={isGuest}
  onLogout={() => {
    localStorage.clear(); // clear tokens
    window.location.reload(); // refresh app
  }}
/>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ChatArea messages={messages} isLoading={isLoading} />
        </div>

        {/* Bottom Chat Input */}
        <div
          className={`${
            darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
          } border-t px-4 py-4`}
        >
          <div className="max-w-3xl mx-auto space-y-3">
            <MessageInput
              value={inputMessage}
              onChange={setInputMessage}
              onSend={handleSendMessage}
              onFileSelect={handleFileUpload}
              disabled={isGuest && guestChatCount >= APP_CONFIG.GUEST_CHAT_LIMIT}
              isLoading={isLoading}
              isAnalyzing={isAnalyzing}
              placeholder={
                isGuest && guestChatCount >= APP_CONFIG.GUEST_CHAT_LIMIT
                  ? "Please login to continue..."
                  : "Message Samvaad-GPT..."
              }
            />
            <p
              className={`text-xs text-center ${
                darkMode ? "text-gray-600" : "text-gray-500"
              }`}
            >
              {isGuest && `Guest: ${guestChatCount}/${APP_CONFIG.GUEST_CHAT_LIMIT} messages • `}
              Samvaad-GPT can make mistakes — verify important info.
            </p>
          </div>
        </div>
      </div>

      {/* Login Popup */}
      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

export default App;
