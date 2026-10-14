import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { ChatArea } from "./components/chat/ChatArea";
import { MessageInput } from "./components/chat/MessageInput";
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
  const { isGuest, user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // ✅ Chat State Management
  const {
    threads,
    currentThreadId,
    messages,
    isLoading,
    fetchThreads,
    loadThread,
    sendMessage,
    deleteThread,
    setMessages,
    resetChat,
    clearChat,
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

  // ✅ Guest User Storage (Strictly isolated to guest mode)
  const [guestMessages, setGuestMessages, clearGuestMessages] = useLocalStorage(
    STORAGE_KEYS.GUEST_MESSAGES,
    []
  );
  const [guestChatCount, setGuestChatCount, clearGuestCount] = useLocalStorage(
    STORAGE_KEYS.GUEST_COUNT,
    0
  );

  // 🛡️ Strict Isolation: Guest chats NEVER leak into logged-in user account
  useEffect(() => {
    if (isGuest) {
      // In guest mode, restore temporary guest messages if any
      if (guestMessages && guestMessages.length > 0) {
        setMessages(guestMessages);
      } else {
        setMessages([]);
      }
    } else {
      // User is LOGGED IN!
      // Immediately clear all guest session messages and count
      clearGuestMessages();
      clearGuestCount();
      resetChat();
      fetchThreads();
    }
  }, [isGuest]);

  // Keep guest storage in sync ONLY while in guest mode
  useEffect(() => {
    if (isGuest) {
      if (messages && messages.length > 0) {
        setGuestMessages(messages);
      } else {
        clearGuestMessages();
      }
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
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    if (isGuest && guestChatCount >= APP_CONFIG.GUEST_CHAT_LIMIT) {
      setShowLoginPopup(true);
      return;
    }

    setInputMessage("");

    try {
      const data = await sendMessage(text, selectedModel);
      if (isGuest && data?.success) {
        const nextCount = (guestChatCount || 0) + 1;
        setGuestChatCount(nextCount);
        if (nextCount >= APP_CONFIG.GUEST_CHAT_LIMIT) {
          setTimeout(() => setShowLoginPopup(true), 1000);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
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
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fileMsg]);
    } catch (err) {
      console.error("File upload error:", err);
      const errorMsg = {
        role: "assistant",
        content: `⚠️ Failed to analyze file: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🆕 Create / Reset to new chat (instant, no clutter in DB)
  const handleNewChat = () => {
    if (isGuest) {
      if (guestMessages && guestMessages.length > 0) {
        handleClearGuestChat();
      } else if (guestChatCount >= APP_CONFIG.GUEST_CHAT_LIMIT) {
        setShowLoginPopup(true);
      }
    } else {
      resetChat();
    }
  };

  // 🧹 Clear guest messages
  const handleClearGuestChat = () => {
    setMessages([]);
    clearGuestMessages();
    clearGuestCount();
  };

  // 🚪 Clean Logout
  const handleLogout = () => {
    handleClearGuestChat();
    clearChat();
    logout();
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
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onSelectPrompt={(prompt) => setInputMessage(prompt)}
          />
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
