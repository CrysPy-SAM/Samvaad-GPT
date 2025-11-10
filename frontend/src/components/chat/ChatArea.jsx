import React, { useRef, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className={`text-7xl mb-6 animate-bounce ${darkMode ? "text-gray-700" : "text-gray-300"}`}>
          🤖
        </div>
        <h2
          className={`text-3xl font-bold mb-3 ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        >
          👋 Welcome to SamvaadGPT!
        </h2>
        <p
          className={`${
            darkMode ? "text-gray-400" : "text-gray-600"
          } text-center max-w-md mb-6 text-lg`}
        >
          💬 Ask me anything! I can help with:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mb-8">
          <div
            className={`${
              darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer`}
          >
            <div className="text-2xl mb-2">💻</div>
            <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              Coding & Tech
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Debug code, learn new languages, build projects
            </p>
          </div>
          
          <div
            className={`${
              darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer`}
          >
            <div className="text-2xl mb-2">✍️</div>
            <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              Writing & Content
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Essays, emails, creative writing, editing
            </p>
          </div>
          
          <div
            className={`${
              darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer`}
          >
            <div className="text-2xl mb-2">📚</div>
            <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              Learning & Research
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Explain topics, summarize content, study help
            </p>
          </div>
          
          <div
            className={`${
              darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer`}
          >
            <div className="text-2xl mb-2">🎨</div>
            <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              Creative Ideas
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Brainstorm, plan projects, generate ideas
            </p>
          </div>
        </div>

        {isGuest && (
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-full ${
              darkMode ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50" : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
            }`}
          >
            <Sparkles size={18} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            <p className={`text-sm font-medium ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
              🎯 Guest Mode: {APP_CONFIG.GUEST_CHAT_LIMIT} free messages • Login for unlimited access
            </p>
          </div>
        )}
        
        <p className={`mt-6 text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
          ⚡ Powered by Samvaad-GPT AI • Built with ❤️ by {APP_CONFIG.CREATOR}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      {messages.map((msg, idx) => (
        <Message key={idx} message={msg} isUser={msg.role === "user"} />
      ))}
      
      {isLoading && (
        <div className="flex gap-3 justify-start animate-fadeIn">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              darkMode ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-blue-400 to-purple-500"
            } text-white font-bold text-xl shadow-lg`}
          >
            🤖
          </div>
          <div
            className={`px-5 py-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800/90 border border-gray-700/50 text-gray-400"
                : "bg-white border border-gray-200 text-gray-600"
            } flex items-center gap-3 shadow-sm`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
            <span className="text-sm font-medium">Thinking... 🤔</span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};