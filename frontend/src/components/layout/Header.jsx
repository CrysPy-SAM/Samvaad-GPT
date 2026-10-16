import React from "react";
import ModelSelector from "../chat/ModelSelector";
import { Sun, Moon, User, LogOut, PanelLeft } from "lucide-react";

export const Header = ({
  isSidebarOpen,
  onToggleSidebar,
  onShowLogin,
  selectedModel,
  onModelChange,
  darkMode,
  toggleTheme,
  user,
  isGuest,
  onLogout,
}) => {
  return (
    <header
      className={`sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b backdrop-blur-md transition-colors duration-200 select-none shrink-0 ${
        darkMode
          ? "bg-[#171717]/90 border-white/10 text-gray-100"
          : "bg-white/90 border-gray-200 text-gray-800"
      }`}
    >
      {/* Left: Sidebar Toggle + Title + Model Selector */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            darkMode
              ? "hover:bg-white/10 text-gray-300 hover:text-white"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          }`}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={19} />
        </button>

        {/* App Title */}
        <h1
          className={`text-base sm:text-lg font-semibold tracking-tight shrink-0 hidden sm:inline ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Samvaad<span className="text-emerald-500 font-bold">GPT</span>
        </h1>

        {/* Model Selector */}
        <div className="min-w-0">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Right: Theme Toggle + User Info + Auth Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
            darkMode
              ? "hover:bg-white/10 text-yellow-400"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          }`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Info */}
        <div
          className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
          title={isGuest ? "Guest User" : user?.name || user?.email || "User"}
        >
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium text-xs shrink-0 shadow-xs ${
              darkMode ? "bg-white/10 text-gray-200" : "bg-gray-200 text-gray-700"
            }`}
          >
            {user?.name ? user.name[0].toUpperCase() : <User size={15} />}
          </div>
          <span className="hidden md:inline max-w-[130px] truncate">
            {isGuest ? "Guest" : user?.name ? `Hi, ${user.name}` : "User"}
          </span>
        </div>

        {/* Buttons */}
        {isGuest ? (
          <button
            onClick={onShowLogin}
            className="px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
          >
            Log in
          </button>
        ) : (
          <button
            onClick={onLogout}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
              darkMode
                ? "bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/5"
                : "bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200"
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        )}
      </div>
    </header>
  );
};
