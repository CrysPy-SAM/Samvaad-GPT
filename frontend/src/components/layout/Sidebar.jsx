import React from "react";
import { Plus, Trash2, MessageSquare, Lock, X } from "lucide-react";
import { APP_CONFIG } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export const Sidebar = ({
  threads,
  currentThreadId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  guestChatCount,
  onClearGuestChat,
  onClose,
  isMobile,
}) => {
  const { isGuest } = useAuth();
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Top Header & New Chat Button */}
      <div className={`p-3 sm:p-4 border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className={`flex-1 flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            } transition-colors font-medium text-sm sm:text-base cursor-pointer shadow-xs`}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>

          {/* 📱 Mobile Close Button */}
          {isMobile && (
            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl md:hidden ${
                darkMode
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              } transition-colors cursor-pointer shrink-0`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="p-3 sm:p-4">
          <div
            className={`${
              darkMode ? "bg-blue-900/30 border-blue-700/60" : "bg-blue-50 border-blue-300"
            } border rounded-xl p-3`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Lock size={15} className={darkMode ? "text-blue-400" : "text-blue-600"} />
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  darkMode ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Guest Mode
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs ${darkMode ? "text-blue-200" : "text-blue-600"}`}>
              {guestChatCount}/{APP_CONFIG.GUEST_CHAT_LIMIT} messages used
            </p>
            <div className="mt-2 bg-gray-700/60 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((guestChatCount || 0) / APP_CONFIG.GUEST_CHAT_LIMIT) * 100)}%`,
                }}
              />
            </div>
            {guestChatCount > 0 && (
              <button
                onClick={onClearGuestChat}
                className={`mt-2.5 w-full text-xs py-1.5 px-2 rounded-lg font-medium cursor-pointer ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } transition-colors`}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {threads.length === 0 ? (
          <div
            className={`text-center py-8 px-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            <p className="text-xs sm:text-sm">
              {isGuest ? "Login to save and access chats across devices" : "No chats yet"}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                currentThreadId === thread.threadId
                  ? darkMode
                    ? "bg-gray-800/90 text-white font-medium"
                    : "bg-gray-200/90 text-gray-900 font-medium"
                  : darkMode
                  ? "hover:bg-gray-800/60 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <MessageSquare
                size={16}
                className={`shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <span className="flex-1 truncate text-xs sm:text-sm">
                {thread.title}
              </span>

              {/* Delete button: accessible on mobile with tap, hover on desktop */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.threadId);
                }}
                className={`p-1.5 rounded-md transition-opacity shrink-0 ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                    : "hover:bg-gray-200 text-gray-500 hover:text-red-600 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                }`}
                title="Delete thread"
                aria-label="Delete thread"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
