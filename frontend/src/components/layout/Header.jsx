import React from "react";
import ModelSelector from "../chat/ModelSelector";
import { Sun, Moon, User, LogOut } from "lucide-react";

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
  onLogout, // ✅ add logout handler
}) => {
  return (
    <header
      className={`flex items-center justify-between px-5 py-3 border-b transition-colors duration-300 shadow-sm ${
        darkMode
          ? "bg-gray-950 border-gray-800 text-gray-100"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* Left: Logo + Model Selector */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg ${
            darkMode
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Toggle Sidebar"
        >
          ☰
        </button>

        {/* App Name */}
        <h1
          className={`text-xl font-bold tracking-tight ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          SamvaadGPT
        </h1>

        {/* Model Selector */}
        <div className="ml-3">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Right: User + Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all ${
            darkMode
              ? "hover:bg-gray-800 text-yellow-400"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          }`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Info */}
        <div
          className={`flex items-center gap-2 text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <User size={16} />
          {isGuest ? "Guest" : user?.name ? `Hi, ${user.name}` : "User"}
        </div>

        {/* Buttons */}
        {isGuest ? (
          // ✅ Login button (for guest)
          <button
            onClick={onShowLogin}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Login
          </button>
        ) : (
          // ✅ Logout button (for logged-in users)
          <button
            onClick={onLogout}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              darkMode
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            <LogOut size={16} /> Logout
          </button>
        )}
      </div>
    </header>
  );
};
