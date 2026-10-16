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
      <div className={`p-3.5 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl ${
              darkMode
                ? "bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200"
            } transition-all font-medium text-sm cursor-pointer active:scale-98`}
          >
            <Plus size={17} className="text-emerald-500" />
            <span className="font-semibold tracking-tight">New chat</span>
          </button>

          {/* 📱 Mobile Close Button */}
          {isMobile && (
            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl md:hidden ${
                darkMode
                  ? "hover:bg-white/10 text-gray-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              } transition-colors cursor-pointer shrink-0`}
              aria-label="Close sidebar"
            >
              <X size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="p-3">
          <div
            className={`${
              darkMode
                ? "bg-gradient-to-br from-blue-950/40 to-indigo-950/20 border-blue-500/30"
                : "bg-blue-50/80 border-blue-200"
            } border rounded-2xl p-3 shadow-xs`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Lock size={14} className={darkMode ? "text-blue-400" : "text-blue-600"} />
                <span
                  className={`text-xs font-semibold ${
                    darkMode ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  Guest Session
                </span>
              </div>
              <span className={`text-[11px] font-mono ${darkMode ? "text-blue-300/80" : "text-blue-600"}`}>
                {guestChatCount}/{APP_CONFIG.GUEST_CHAT_LIMIT}
              </span>
            </div>
            <div className="mt-2 bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
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
                    ? "bg-white/10 hover:bg-white/15 text-gray-300"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                } transition-colors text-center`}
              >
                Clear Guest Chat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Threads Section Header */}
      {!isGuest && threads.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Recent Chats
          </span>
        </div>
      )}

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {threads.length === 0 ? (
          <div
            className={`text-center py-12 px-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            <p className="text-xs leading-relaxed">
              {isGuest ? "Sign in to save chat history and resume anytime." : "No saved chats yet. Start a conversation!"}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                currentThreadId === thread.threadId
                  ? darkMode
                    ? "bg-white/10 text-white font-medium shadow-xs"
                    : "bg-gray-200 text-gray-900 font-medium shadow-xs"
                  : darkMode
                  ? "hover:bg-white/5 text-gray-400 hover:text-gray-200"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare
                size={15}
                className={`shrink-0 ${
                  currentThreadId === thread.threadId
                    ? "text-emerald-500"
                    : darkMode
                    ? "text-gray-500 group-hover:text-gray-400"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="flex-1 truncate text-xs">
                {thread.title}
              </span>

              {/* Delete button: touch friendly on mobile, hover on desktop */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.threadId);
                }}
                className={`p-1.5 rounded-lg transition-all shrink-0 ${
                  darkMode
                    ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                    : "hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                }`}
                title="Delete chat"
                aria-label="Delete chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
