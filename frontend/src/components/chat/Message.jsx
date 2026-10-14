import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Volume2, VolumeX, Copy, Check, Terminal, Bot, User, Sparkles } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";
import "katex/dist/katex.min.css";

// 💻 Professional ChatGPT-Style Code Block
const CodeBlock = ({ language, value, darkMode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = (language || "code").toLowerCase().trim();

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-700/60 bg-[#1e1e1e] shadow-xl">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-300 text-xs font-mono border-b border-gray-700/60 select-none">
        <span className="flex items-center gap-1.5 font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
          <Terminal size={14} className="text-blue-400" />
          {cleanLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto text-[13.5px] leading-relaxed">
        <SyntaxHighlighter
          style={oneDark}
          language={cleanLang === "code" || cleanLang === "text" ? "text" : cleanLang}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            backgroundColor: "#1e1e1e",
            fontSize: "0.875rem",
            lineHeight: "1.65",
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const Message = ({ message = {}, isUser = false, isLatest = false }) => {
  const { darkMode } = useTheme();
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const content = message?.content || "";
  const timestamp = message?.timestamp;
  const modelUsed = message?.metadata?.model;

  // ⚡ ChatGPT-Style Adaptive Streaming Animation (fast & clean, only for new message)
  useEffect(() => {
    if (isUser || !content || !isLatest) {
      setDisplayedText(content);
      setTypingDone(true);
      return;
    }

    setDisplayedText("");
    setTypingDone(false);

    let currentIndex = 0;
    // Adaptive step ensures long code finishes in ~1.5s while short text feels natural
    const step = Math.max(3, Math.floor(content.length / 70));
    const interval = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= content.length) {
        setDisplayedText(content);
        setTypingDone(true);
        clearInterval(interval);
      } else {
        setDisplayedText(content.slice(0, currentIndex));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, isUser, isLatest]);

  // 🔊 Text-to-speech
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/```[\s\S]*?```/g, "Code block omitted.");
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // 📋 Copy entire message
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full py-2 animate-fadeIn flex flex-col ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`flex gap-3.5 max-w-full ${
          isUser
            ? "flex-row-reverse max-w-[85%] md:max-w-[75%]"
            : "flex-row w-full"
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs shadow-md ${
                darkMode
                  ? "bg-gradient-to-tr from-gray-700 to-gray-600 text-gray-200"
                  : "bg-gradient-to-tr from-gray-300 to-gray-200 text-gray-700"
              }`}
            >
              <User size={16} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-md font-bold">
              <Sparkles size={16} />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className={`min-w-0 flex-1 ${isUser ? "flex justify-end" : ""}`}>
          {isUser ? (
            /* User Message Bubble */
            <div
              className={`px-5 py-3 rounded-3xl text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                darkMode
                  ? "bg-[#2f2f2f] text-gray-100"
                  : "bg-blue-600 text-white"
              }`}
            >
              {content}
            </div>
          ) : (
            /* Assistant Message Layout (Full reading width, ChatGPT typography) */
            <div
              className={`text-[15px] leading-7 break-words ${
                darkMode ? "text-gray-100" : "text-gray-800"
              }`}
            >
              <div className="prose prose-base max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    // Prevent <pre> wrapper conflict with custom CodeBlock
                    pre({ children }) {
                      return <>{children}</>;
                    },

                    // Intelligent Code Detection
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const rawContent = String(children).replace(/\n$/, "");

                      if (!inline && (match || rawContent.includes("\n"))) {
                        return (
                          <CodeBlock
                            language={match ? match[1] : "code"}
                            value={rawContent}
                            darkMode={darkMode}
                          />
                        );
                      }

                      // Inline Code
                      return (
                        <code
                          className={`px-1.5 py-0.5 rounded text-[13px] font-mono font-medium ${
                            darkMode
                              ? "bg-gray-800 text-pink-400 border border-gray-700/60"
                              : "bg-gray-100 text-pink-600 border border-gray-200"
                          }`}
                          {...props}
                        >
                          {rawContent}
                        </code>
                      );
                    },

                    // Paragraphs
                    p({ children }) {
                      return <p className="my-2.5 leading-7">{children}</p>;
                    },

                    // Headings
                    h1({ children }) {
                      return (
                        <h1 className="text-2xl font-bold mt-6 mb-3 tracking-tight">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-xl font-bold mt-5 mb-2.5 tracking-tight">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-lg font-semibold mt-4 mb-2 tracking-tight">
                          {children}
                        </h3>
                      );
                    },

                    // Lists
                    ul({ children }) {
                      return (
                        <ul className="list-disc list-outside ml-6 my-2.5 space-y-1.5">
                          {children}
                        </ul>
                      );
                    },
                    ol({ children }) {
                      return (
                        <ol className="list-decimal list-outside ml-6 my-2.5 space-y-1.5">
                          {children}
                        </ol>
                      );
                    },
                    li({ children }) {
                      return <li className="leading-7 pl-1">{children}</li>;
                    },

                    // Blockquotes
                    blockquote({ children }) {
                      return (
                        <blockquote
                          className={`border-l-4 border-blue-500 pl-4 py-1 my-3 italic rounded-r-lg ${
                            darkMode ? "bg-blue-950/20 text-gray-300" : "bg-blue-50/60 text-gray-700"
                          }`}
                        >
                          {children}
                        </blockquote>
                      );
                    },

                    // Tables
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-xl border border-gray-700/50 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-700/50 text-sm">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return (
                        <thead className={darkMode ? "bg-gray-800/80 text-gray-200" : "bg-gray-100 text-gray-800"}>
                          {children}
                        </thead>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-xs">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td
                          className={`px-4 py-2.5 border-t ${
                            darkMode ? "border-gray-800 text-gray-300" : "border-gray-200 text-gray-700"
                          }`}
                        >
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
                          className="text-blue-500 hover:text-blue-400 underline underline-offset-2 transition-colors font-medium"
                        >
                          {children}
                        </a>
                      );
                    },

                    // Strong
                    strong({ children }) {
                      return (
                        <strong className="font-semibold text-inherit">
                          {children}
                        </strong>
                      );
                    },
                  }}
                >
                  {displayedText}
                </ReactMarkdown>

                {/* Blinking Cursor while streaming */}
                {!typingDone && (
                  <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-pulse align-middle rounded-sm" />
                )}
              </div>

              {/* Action Buttons & Metadata Bar (ChatGPT style) */}
              {typingDone && (
                <div className="flex items-center gap-3 mt-3 pt-2 text-xs text-gray-400 select-none">
                  <button
                    onClick={() => handleCopyMessage(content)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-700/40 hover:text-gray-200 transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => speak(content)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-700/40 hover:text-gray-200 transition-colors cursor-pointer"
                    title={isSpeaking ? "Stop speaking" : "Read aloud"}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={14} className="text-amber-400" />
                        <span className="text-amber-400">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} />
                        <span>Listen</span>
                      </>
                    )}
                  </button>

                  {modelUsed && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800/50 text-gray-400 border border-gray-700/40">
                      {modelUsed}
                    </span>
                  )}

                  {timestamp && (
                    <span className="text-[11px] text-gray-500 ml-auto">
                      {formatTime(timestamp)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};