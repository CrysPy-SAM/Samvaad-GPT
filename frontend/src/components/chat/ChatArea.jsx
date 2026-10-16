import React, { useRef, useEffect } from "react";
import { Sparkles, Code2, PenTool, Compass, FileSearch } from "lucide-react";
import { Message } from "./Message";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { APP_CONFIG } from "../../utils/constants";

export const ChatArea = ({ messages, isLoading, onSelectPrompt }) => {
  const { darkMode } = useTheme();
  const { isGuest } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const promptSuggestions = [
    {
      icon: <Code2 size={18} className="text-cyan-400" />,
      title: "Write clean code",
      desc: "Build a Python script, React component, or REST API",
      prompt: "Write a complete, production-ready React component with Tailwind CSS for an interactive dashboard card.",
    },
    {
      icon: <PenTool size={18} className="text-amber-400" />,
      title: "Draft & refine writing",
      desc: "Emails, essays, cover letters, or documentation",
      prompt: "Draft a clear, professional email to an engineering manager proposing an architecture refactor.",
    },
    {
      icon: <Compass size={18} className="text-emerald-400" />,
      title: "Explain a concept",
      desc: "Break down complex topics into simple terms",
      prompt: "Explain how WebSockets work compared to HTTP polling with clear analogies.",
    },
    {
      icon: <FileSearch size={18} className="text-purple-400" />,
      title: "Analyze & debug",
      desc: "Find errors, review algorithms, optimize performance",
      prompt: "Help me debug a slow database query. What are the top 5 indexing strategies?",
    },
  ];

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-12 animate-fadeIn">
        {/* ChatGPT Logo Icon with subtle aura */}
        <div className="relative mb-4 sm:mb-6 shrink-0">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl" />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-xl">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
        </div>

        <h2
          className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight text-center ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          What can I help with today?
        </h2>

        <p
          className={`text-xs sm:text-sm md:text-base text-center max-w-md mb-6 sm:mb-9 px-2 leading-relaxed ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Ask questions, write complete code, analyze documents, or brainstorm creative ideas.
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full mb-6 sm:mb-8">
          {promptSuggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
              className={`flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
                darkMode
                  ? "bg-[#212121]/90 border-white/10 hover:border-emerald-500/40 hover:bg-[#262626] shadow-sm hover:shadow-lg"
                  : "bg-white border-gray-200 hover:border-emerald-500/40 hover:shadow-md"
              }`}
            >
              <div className="mb-2 p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <h3
                className={`font-semibold text-xs sm:text-sm mb-1 group-hover:text-emerald-500 transition-colors ${
                  darkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {item.title}
              </h3>
              <p
                className={`text-[11px] sm:text-xs leading-relaxed ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Guest Mode Badge */}
        {isGuest && (
          <div
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-2xl border text-[11px] sm:text-xs font-medium text-center max-w-full ${
              darkMode
                ? "bg-blue-950/30 border-blue-500/30 text-blue-300"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <Sparkles size={14} className="shrink-0 text-blue-400" />
            <span>
              Guest Mode: {APP_CONFIG.GUEST_CHAT_LIMIT} free messages • Login for saved threads & unlimited chats
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 pb-6">
      {messages.map((msg, idx) => (
        <Message
          key={idx}
          message={msg}
          isUser={msg.role === "user"}
          isLatest={idx === messages.length - 1}
        />
      ))}

      {/* Thinking Indicator */}
      {isLoading && (
        <div className="flex gap-3 items-start animate-fadeIn w-full py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-md font-bold shrink-0">
            <Sparkles size={15} />
          </div>
          <div className="flex items-center gap-2.5 pt-1.5 text-xs sm:text-sm text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium animate-pulse text-emerald-400">Thinking & generating response...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};