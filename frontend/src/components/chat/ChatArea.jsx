import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Message } from "./Message";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { APP_CONFIG } from "../../utils/constants";

export const ChatArea = ({ messages, isLoading }) => {
  const { darkMode } = useTheme();
  const { isGuest } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`text-6xl mb-4 ${darkMode ? "text-gray-700" : "text-gray-300"}`}>
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
          Ask me anything! I can help with coding, writing, analysis, and more.
        </p>
        {isGuest && (
          <div
            className={`mt-4 px-4 py-2 rounded-lg ${
              darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
            }`}
          >
            <p className="text-sm">
              🎯 Guest Mode: {APP_CONFIG.GUEST_CHAT_LIMIT} free messages • Login for
              unlimited access
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {messages.map((msg, idx) => (
        <Message key={idx} message={msg} isUser={msg.role === "user"} />
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
  );
};