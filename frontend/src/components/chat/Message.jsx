import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Volume2, VolumeX, Copy, Check } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";

export const Message = ({ message = {}, isUser = false }) => {
  const { darkMode } = useTheme();
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const content = message?.content || "";
  const timestamp = message?.timestamp;

  const typingSpeed = 10; // Faster typing for better UX

  // Typing effect for AI
  useEffect(() => {
    if (isUser || !content) {
      setDisplayedText(content);
      setTypingDone(true);
      return;
    }
    setDisplayedText("");
    setTypingDone(false);
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

  // Text-to-speech
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

  // Copy to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 animate-fadeIn ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            darkMode ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-blue-400 to-purple-500"
          } text-white font-bold text-sm shadow-lg`}
        >
          🤖
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={`relative px-5 py-4 rounded-2xl leading-relaxed shadow-sm ${
            isUser
              ? darkMode
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : darkMode
              ? "bg-gray-800/90 text-gray-100 border border-gray-700/50"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          {/* Typing indicator */}
          {!typingDone && !isUser && (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {content}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
                components={{
                  // Code blocks
                  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    // ✅ FIX: Ensure children is always a string
    let codeString = String(children);
    if (codeString.endsWith('\n')) {
      codeString = codeString.slice(0, -1);
    }

    return !inline && match ? (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono uppercase tracking-wide">
            {match[1]}
          </span>
          <button
            onClick={() => handleCopy(codeString)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-800"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    ) : (
      // ✅ FIX: Inline code should also convert to string
      <code
        className={`${
          darkMode
            ? "bg-gray-700/50 text-blue-300"
            : "bg-gray-100 text-blue-600"
        } px-1.5 py-0.5 rounded text-sm font-mono`}
        {...props}
      >
        {typeof children === 'string' ? children : String(children)}
      </code>
    );
  },

                  // Paragraphs
                  p({ children }) {
                    return (
                      <p className={`my-3 text-[15px] leading-relaxed ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                        {children}
                      </p>
                    );
                  },

                  // Headings
                  h1({ children }) {
                    return (
                      <h1 className={`text-2xl font-bold mt-6 mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className={`text-xl font-bold mt-5 mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className={`text-lg font-semibold mt-4 mb-2 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                        {children}
                      </h3>
                    );
                  },

                  // Lists
                  ul({ children }) {
                    return (
                      <ul className={`list-disc list-outside ml-6 my-3 space-y-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className={`list-decimal list-outside ml-6 my-3 space-y-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="leading-relaxed pl-1">{children}</li>;
                  },

                  // Blockquotes
                  blockquote({ children }) {
                    return (
                      <blockquote
                        className={`border-l-4 ${
                          darkMode ? "border-blue-500 bg-blue-900/20" : "border-blue-400 bg-blue-50"
                        } pl-4 py-2 my-3 italic`}
                      >
                        {children}
                      </blockquote>
                    );
                  },

                  // Tables
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4">
                        <table className={`min-w-full border ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return (
                      <thead className={darkMode ? "bg-gray-700" : "bg-gray-100"}>
                        {children}
                      </thead>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className={`px-4 py-2 text-left font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className={`px-4 py-2 border-t ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                        {children}
                      </td>
                    );
                  },

                  // Links
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${
                          darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        } underline transition-colors`}
                      >
                        {children}
                      </a>
                    );
                  },

                  // Strong/Bold
                  strong({ children }) {
                    return (
                      <strong className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {children}
                      </strong>
                    );
                  },

                  // Emphasis/Italic
                  em({ children }) {
                    return (
                      <em className={darkMode ? "text-gray-300" : "text-gray-700"}>
                        {children}
                      </em>
                    );
                  },

                  // Horizontal rule
                  hr() {
                    return (
                      <hr className={`my-4 ${darkMode ? "border-gray-700" : "border-gray-300"}`} />
                    );
                  },
                }}
              >
                {displayedText}
              </ReactMarkdown>
            </div>
          )}

          {/* Action buttons */}
          {!isUser && typingDone && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/30">
              <button
                onClick={() => speak(content)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-xs ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                }`}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                onClick={() => handleCopy(content)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-xs ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                }`}
                title="Copy message"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
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

      {/* User Avatar */}
      {isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            darkMode ? "bg-gradient-to-br from-gray-600 to-gray-700" : "bg-gradient-to-br from-gray-400 to-gray-500"
          } text-white font-semibold text-xs shadow-lg`}
        >
          👤
        </div>
      )}
    </div>
  );
};