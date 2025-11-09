import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";

export const Message = ({ message, isUser }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-blue-600" : "bg-blue-500"
          } text-white flex-shrink-0 font-bold text-sm`}
        >
          AI
        </div>
      )}
      
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? darkMode
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : darkMode
              ? "bg-gray-800 text-gray-100"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        </div>
        {message.timestamp && (
          <span
            className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-500"} ${
              isUser ? "text-right" : "text-left"
            } px-2`}
          >
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
      
      {isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-700"
          } flex-shrink-0 font-semibold text-xs`}
        >
          You
        </div>
      )}
    </div>
  );
};