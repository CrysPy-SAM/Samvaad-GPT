import React, { useRef, useEffect } from "react";
import { Send, Upload, Loader2 } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

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
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
