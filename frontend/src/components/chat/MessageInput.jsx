import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Paperclip, Loader2, Mic, MicOff, FileText } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition || null);

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  disabled,
  isLoading,
  isAnalyzing,
  placeholder = "Message Samvaad-GPT...",
}) => {
  const { darkMode } = useTheme();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [value]);

  // Start/stop speech recognition
  const handleVoiceInput = async () => {
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Please use Chrome.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      setIsListening(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Microphone permission denied. Please allow microphone access.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (ev) => {
      setIsListening(false);
      if (ev.error === "not-allowed" || ev.error === "security") {
        alert("Microphone access blocked. Please enable it in browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        const newText = value ? `${value} ${transcript}` : transcript;
        onChange(newText);
      } catch (e) {
        console.error("Speech parsing error:", e);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start failed:", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !isAnalyzing && !disabled) {
        onSend();
      }
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !isAnalyzing && !disabled;

  return (
    <div className="relative w-full">
      {/* File analysis banner */}
      {isAnalyzing && (
        <div
          className={`mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm shadow-sm animate-fadeIn ${
            darkMode
              ? "bg-gray-800/90 border-gray-700 text-blue-400"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <Loader2 className="animate-spin text-blue-500" size={16} />
          <span className="font-medium">Analyzing file content with AI...</span>
        </div>
      )}

      {/* ChatGPT Floating Input Box */}
      <div
        className={`flex items-end gap-1.5 sm:gap-2.5 px-3 py-2 sm:py-2.5 rounded-3xl border transition-all duration-200 shadow-md ${
          darkMode
            ? "bg-[#212121]/95 border-white/10 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-black/20"
            : "bg-white border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-gray-200/50"
        }`}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onFileSelect(e.target.files[0]);
              e.target.value = "";
            }
          }}
          className="hidden"
          accept=".pdf,.txt,.js,.json,.py,.jpg,.jpeg,.png,.md,.csv"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing || isLoading || disabled}
          className={`p-2 rounded-full transition-colors shrink-0 ${
            darkMode
              ? "hover:bg-white/10 text-gray-400 hover:text-gray-200"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          } disabled:opacity-40 cursor-pointer`}
          title="Upload document or image"
          aria-label="Upload document or image"
        >
          <Paperclip size={19} />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || isAnalyzing || disabled}
          className={`flex-1 bg-transparent border-0 outline-none resize-none py-1.5 px-1.5 sm:px-2 text-base sm:text-[15px] leading-relaxed max-h-44 ${
            darkMode
              ? "text-gray-100 placeholder-gray-500"
              : "text-gray-900 placeholder-gray-400"
          }`}
          rows={1}
          style={{ minHeight: "26px" }}
        />

        {/* Speech-to-Text Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isAnalyzing || isLoading || disabled}
          className={`p-2 rounded-full transition-all shrink-0 cursor-pointer ${
            isListening
              ? "bg-red-500 text-white shadow-md animate-pulse"
              : darkMode
              ? "hover:bg-white/10 text-gray-400 hover:text-gray-200"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          } disabled:opacity-40`}
          title={isListening ? "Listening... click to stop" : "Voice input"}
          aria-label="Voice input"
        >
          {isListening ? <MicOff size={19} /> : <Mic size={19} />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
            canSend
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer active:scale-95"
              : darkMode
              ? "bg-white/10 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          title="Send message"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-emerald-400" size={17} />
          ) : (
            <ArrowUp size={19} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
};
