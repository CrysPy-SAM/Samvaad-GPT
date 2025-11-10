import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import "highlight.js/styles/github-dark.css";
import { Volume2, VolumeX } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";

export const Message = ({ message = {}, isUser = false }) => {
  const { darkMode } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const content = message?.content || "";
  const timestamp = message?.timestamp;

  // Load voices for speech synthesis
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  const speak = (text) => {
    try {
      if (!("speechSynthesis" in window)) return;
      if (!text.trim()) return;

      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      utter.voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.error("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div
  className={`flex gap-3 fade-in transition-all duration-300 ease-in-out transform ${
    isUser ? "justify-end" : "justify-start"
  }`}
>

      {/* Avatar for AI */}
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-blue-600" : "bg-blue-500"
          } text-white font-bold text-sm`}
        >
          AI
        </div>
      )}

      {/* Message bubble */}
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={`relative px-4 py-3 rounded-2xl leading-relaxed ${
            isUser
              ? darkMode
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : darkMode
              ? "bg-gray-800 text-gray-100"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          {/* User Message */}
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          ) : (
            // ✅ ChatGPT-style Markdown rendering
            <ReactMarkdown
  remarkPlugins={[remarkGfm, remarkEmoji]}
  components={{
    a: ({ node, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
      />
    ),
    h1: ({ node, ...props }) => (
      <h1 {...props} className="text-xl font-bold border-b pb-1 mb-2" />
    ),
    h2: ({ node, ...props }) => (
      <h2 {...props} className="text-lg font-semibold border-b pb-1 mb-2" />
    ),
    p: ({ node, ...props }) => (
      <p
        {...props}
        className="leading-relaxed my-2 text-[15px] whitespace-pre-wrap break-words"
      />
    ),
    ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-5 space-y-1" />,
    ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-5 space-y-1" />,
    li: ({ node, ...props }) => <li {...props} className="ml-1" />,
    code: ({ inline, children, ...props }) => (
      <code
        {...props}
        className={`${
          inline
            ? "bg-gray-800 text-gray-100 px-1 rounded"
            : "block bg-gray-900 text-gray-100 p-2 rounded-lg my-2 overflow-x-auto text-sm"
        }`}
      >
        {children}
      </code>
    ),
    strong: ({ node, ...props }) => (
      <strong {...props} className="font-semibold text-blue-500" />
    ),
    em: ({ node, ...props }) => <em {...props} className="italic text-gray-400" />,
  }}
>
  {content}
</ReactMarkdown>


          )}

          {/* 🔊 Voice playback */}
          {!isUser && content && (
            <button
              onClick={() => speak(content)}
              className={`absolute right-2 bottom-2 p-1 rounded-full transition ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title={isSpeaking ? "Stop speaking" : "Play message"}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>

        {/* 🕒 Timestamp */}
        {timestamp && (
          <span
            className={`text-xs ${
              darkMode ? "text-gray-500" : "text-gray-600"
            } ${isUser ? "text-right" : "text-left"} px-2`}
          >
            {formatTime(timestamp)}
          </span>
        )}
      </div>
      

      {/* Avatar for User */}
      {isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-700"
          } font-semibold text-xs`}
        >
          You
        </div>
        
      )}
      
    </div>
    
  );
};
