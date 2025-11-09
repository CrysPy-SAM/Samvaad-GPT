import React, { useRef, useEffect, useState } from "react";
import { Send, Upload, Loader2, Mic, MicOff } from "lucide-react";
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
  placeholder = "Message SamvaadGPT...",
}) => {
  const { darkMode } = useTheme();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  // Start/stop speech recognition with robust checks
  const handleVoiceInput = async () => {
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not available in this browser.");
      alert("Your browser doesn't support Speech Recognition. Use Chrome.");
      return;
    }

    // If currently listening -> stop
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      setIsListening(false);
      return;
    }

    // Ask for mic permission proactively (getUserMedia) to trigger browser prompt
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone permission denied or unavailable", err);
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
      console.log("[STT] started");
    };

    recognition.onerror = (ev) => {
      console.error("[STT] error", ev);
      setIsListening(false);
      // provide user friendly message for common errors
      if (ev.error === "not-allowed" || ev.error === "security") {
        alert("Microphone access blocked. Please enable it in browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("[STT] ended");
    };

    recognition.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        // Append or replace text intelligently
        const newText = value ? `${value} ${transcript}` : transcript;
        onChange(newText);
        // optionally auto-send here if you want:
        // onSend(newText);
      } catch (e) {
        console.error("[STT] result parse error", e);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("recognition.start() failed:", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative">
      {isAnalyzing && (
        <div
          className={`mb-3 flex items-center gap-2 px-4 py-2 rounded-lg ${
            darkMode ? "bg-gray-800 text-gray-300" : "bg-blue-50 text-blue-700"
          }`}
        >
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">Analyzing file...</span>
        </div>
      )}

      <div
        className={`flex gap-2 items-end ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        } rounded-2xl p-2`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
          className="hidden"
          accept=".pdf,.txt,.js,.json,.py,.jpg,.jpeg,.png,.md,.csv"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing || isLoading || disabled}
          className={`p-2 rounded-lg ${
            darkMode
              ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
              : "hover:bg-gray-200 text-gray-600 hover:text-gray-700"
          } disabled:opacity-50 transition-colors`}
          title="Upload file"
        >
          <Upload size={20} />
        </button>

        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isAnalyzing || isLoading || disabled}
          className={`p-2 rounded-lg transition-colors ${
            isListening
              ? "bg-red-600 text-white"
              : darkMode
              ? "bg-gray-700 text-gray-400 hover:text-gray-200"
              : "bg-gray-200 text-gray-600 hover:text-gray-800"
          }`}
          title="Speak message"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || isAnalyzing || disabled}
          className={`flex-1 bg-transparent ${
            darkMode
              ? "text-white placeholder-gray-500"
              : "text-gray-900 placeholder-gray-400"
          } outline-none resize-none max-h-32 py-2 px-2`}
          rows={1}
          style={{ minHeight: "24px" }}
        />

        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading || isAnalyzing || disabled}
          className={`p-2 rounded-lg transition-all ${
            value.trim() && !isLoading && !isAnalyzing && !disabled
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-500"
              : "bg-gray-200 text-gray-400"
          } disabled:cursor-not-allowed`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};
