import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import rehypeHighlight from "rehype-highlight";
import { Volume2, VolumeX, Copy } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";
import "highlight.js/styles/github-dark.css";

export const Message = ({ message = {}, isUser = false }) => {
  const { darkMode } = useTheme();
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const content = message?.content || "";
  const timestamp = message?.timestamp;

  const typingSpeed = 15; // ms per character (adjust to change typing speed)

  // 🧠 Typing effect for AI
  useEffect(() => {
    if (isUser || !content) {
      setDisplayedText(content);
      setTypingDone(true);
      return;
    }
    setDisplayedText("");
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + content[index]);
      index++;
      if (index >= content.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, typingSpeed);
    return () => clearInterval(interval);
  }, [content, isUser]);

  // 🎤 Speech
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // 📋 Copy code
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ✨ Emoji & tone formatting
  const enhanceMessage = (text) =>
    text
      .replace(/^### (.*$)/gim, "💡 **$1**")
      .replace(/^> (.*$)/gim, "💬 *$1*")
      .replace(/\*\*(Note|Tip|Hint|Important):\*\*/gim, "💡 **$1:**")
      .replace(/\*\*(Warning|Error|Caution):\*\*/gim, "⚠️ **$1:**")
      .replace(/\*\*(Step|Task|Action)\s(\d+):\*\*/gim, "✅ **$1 $2:**")
      .replace(/\*\*(Success|Done):\*\*/gim, "🎉 **$1:**");

  const enhanced = enhanceMessage(displayedText);

  return (
    <div
      className={`flex gap-3 transition-all duration-300 ease-in-out transform ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-blue-600" : "bg-blue-500"
          } text-white font-bold text-sm`}
        >
          AI
        </div>
      )}

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
          {/* AI Typing animation */}
          {!typingDone && !isUser && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkParse, remarkGfm, remarkEmoji]}
              rehypePlugins={[[rehypeHighlight, { detect: true }]]}
              components={{
                code: ({ inline, className, children, ...props }) => (
                  <div className="relative group">
                    <code
                      {...props}
                      className={`${
                        inline
                          ? "bg-gray-700 text-gray-100 px-1 rounded"
                          : "block bg-[#0d1117] text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono"
                      }`}
                    >
                      {children}
                    </code>
                    {!inline && (
                      <button
                        onClick={() => handleCopy(children)}
                        className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition"
                        title={copied ? "Copied!" : "Copy code"}
                      >
                        <Copy
                          size={16}
                          className={`${
                            copied
                              ? "text-green-400"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                ),
                p: ({ node, ...props }) => (
                  <p
                    {...props}
                    className="leading-relaxed my-2 text-[15px] whitespace-pre-wrap break-words"
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-semibold text-blue-500" />
                ),
                em: ({ node, ...props }) => (
                  <em {...props} className="italic text-gray-400" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    {...props}
                    className="border-l-4 border-blue-500 pl-3 italic opacity-90"
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc ml-6 space-y-1" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal ml-6 space-y-1" />
                ),
              }}
            >
              {enhanced}
            </ReactMarkdown>
          )}

          {!isUser && typingDone && (
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
