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
import { APP_CONFIG, STORAGE_KEYS } from "./utils/constants";

function App() {
  const { isGuest } = useAuth();
  const { darkMode } = useTheme();
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [guestMessages, setGuestMessages, clearGuestMessages] = useLocalStorage(
    STORAGE_KEYS.GUEST_MESSAGES,
    []
  );
  const [guestChatCount, setGuestChatCount, clearGuestCount] = useLocalStorage(
    STORAGE_KEYS.GUEST_COUNT,
    0
  );

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

    if (isGuest) {
      try {
        const data = await sendMessage(inputMessage.trim());
        setGuestChatCount(guestChatCount + 1);
        
        if (guestChatCount + 1 >= APP_CONFIG.GUEST_CHAT_LIMIT) {
          setTimeout(() => setShowLoginPopup(true), 1000);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    } else {
      try {
        await sendMessage(inputMessage.trim());
      } catch (err) {
        console.error("Error:", err);
      }
    }
  };

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

  const handleNewChat = () => {
    if (isGuest) {
      setShowLoginPopup(true);
    } else {
      createThread();
    }
  };

  const handleClearGuestChat = () => {
    setMessages([]);
    clearGuestMessages();
    clearGuestCount();
  };

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} overflow-hidden`}>
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
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onShowLogin={() => setShowLoginPopup(true)}
        />

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ChatArea messages={messages} isLoading={isLoading} />
        </div>

        <div
          className={`${
            darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
          } border-t px-4 py-4`}
        >
          <div className="max-w-3xl mx-auto">
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
                  : "Message SamvaadGPT..."
              }
            />
            <p
              className={`text-xs ${
                darkMode ? "text-gray-600" : "text-gray-500"
              } mt-2 text-center`}
            >
              {isGuest && `Guest: ${guestChatCount}/${APP_CONFIG.GUEST_CHAT_LIMIT} messages • `}
              SamvaadGPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

export default App;