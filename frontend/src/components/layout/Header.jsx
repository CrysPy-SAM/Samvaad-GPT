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
      className={`flex items-center justify-between px-2.5 sm:px-5 py-2.5 sm:py-3 border-b transition-colors duration-300 shadow-xs shrink-0 select-none ${
        darkMode
          ? "bg-gray-950 border-gray-800 text-gray-100"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* Left: Sidebar Toggle + Title + Model Selector */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
            darkMode
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={18} />
        </button>

        {/* App Title: Responsive truncation */}
        <h1
          className={`text-base sm:text-lg md:text-xl font-bold tracking-tight shrink-0 hidden sm:inline ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          SamvaadGPT
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
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all shrink-0 cursor-pointer ${
            darkMode
              ? "hover:bg-gray-800 text-yellow-400"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          }`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Info (Icon always visible; text hidden on small screens) */}
        <div
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
          title={isGuest ? "Guest User" : user?.name || user?.email || "User"}
        >
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
              darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            <User size={15} />
          </div>
          <span className="hidden md:inline max-w-[120px] truncate">
            {isGuest ? "Guest" : user?.name ? `Hi, ${user.name}` : "User"}
          </span>
        </div>

        {/* Buttons */}
        {isGuest ? (
          // ✅ Login button
          <button
            onClick={onShowLogin}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-xs cursor-pointer shrink-0 ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Login
          </button>
        ) : (
          // ✅ Logout button (icon on mobile, icon+text on desktop)
          <button
            onClick={onLogout}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shrink-0 ${
              darkMode
                ? "bg-red-600/90 hover:bg-red-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
