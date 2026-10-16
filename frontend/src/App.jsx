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

  // 📱 Mobile responsiveness state (sidebar defaults to closed on mobile, open on desktop)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [inputMessage, setInputMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resize listener to handle viewport transitions
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar when transitioning from desktop to mobile
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

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
    if (isMobile) {
      setIsSidebarOpen(false);
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
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } overflow-hidden relative`}
    >
      {/* 📱 Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity animate-fadeIn md:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* 🧭 Sidebar: Desktop collapsible flex column / Mobile fixed drawer */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out shadow-2xl ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `${isSidebarOpen ? "w-64" : "w-0"} transition-all duration-300 relative`
        } ${
          darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
        } border-r overflow-hidden flex flex-col shrink-0`}
      >
        <Sidebar
          threads={threads}
          currentThreadId={currentThreadId}
          onNewChat={handleNewChat}
          onSelectThread={(id) => {
            loadThread(id);
            if (isMobile) setIsSidebarOpen(false);
          }}
          onDeleteThread={deleteThread}
          guestChatCount={guestChatCount}
          onClearGuestChat={handleClearGuestChat}
          user={user}
          isGuest={isGuest}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* 💬 Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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

        <div className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 sm:py-6">
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
          } border-t px-2.5 sm:px-4 py-2 sm:py-3`}
        >
          <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
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
              className={`text-[11px] sm:text-xs text-center px-1 leading-normal ${
                darkMode ? "text-gray-500" : "text-gray-500"
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
