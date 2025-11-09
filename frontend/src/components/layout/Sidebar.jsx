import React from "react";
import { Plus, Trash2, MessageSquare, Lock } from "lucide-react";
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
}) => {
  const { isGuest } = useAuth();
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          } transition-colors font-medium`}
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="p-4">
          <div
            className={`${
              darkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-300"
            } border rounded-lg p-3`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className={darkMode ? "text-blue-400" : "text-blue-600"} />
              <span
                className={`text-sm font-semibold ${
                  darkMode ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Guest Mode
              </span>
            </div>
            <p className={`text-xs ${darkMode ? "text-blue-200" : "text-blue-600"}`}>
              {guestChatCount}/{APP_CONFIG.GUEST_CHAT_LIMIT} messages used
            </p>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(guestChatCount / APP_CONFIG.GUEST_CHAT_LIMIT) * 100}%`,
                }}
              />
            </div>
            {guestChatCount > 0 && (
              <button
                onClick={onClearGuestChat}
                className={`mt-3 w-full text-xs px-2 py-1 rounded ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <div
            className={`text-center py-8 ${darkMode ? "text-gray-600" : "text-gray-400"}`}
          >
            <p className="text-sm">
              {isGuest ? "Login to save chats" : "No chats yet"}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                currentThreadId === thread.threadId
                  ? darkMode
                    ? "bg-gray-800"
                    : "bg-gray-100"
                  : darkMode
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-100"
              }`}
            >
              <MessageSquare
                size={16}
                className={darkMode ? "text-gray-400" : "text-gray-600"}
              />
              <span
                className={`flex-1 truncate text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {thread.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.threadId);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-red-400"
                    : "hover:bg-gray-200 text-gray-600 hover:text-red-600"
                }`}
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
