import React from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { APP_CONFIG } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export const Header = ({ isSidebarOpen, onToggleSidebar, onShowLogin }) => {
  const { isGuest, user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div
      className={`${
        darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
      } border-b px-4 py-3 flex items-center justify-between`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg ${
            darkMode
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          } transition-colors`}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h1
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {APP_CONFIG.NAME}
          </h1>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Built by {APP_CONFIG.CREATOR}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${
            darkMode
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          } transition-colors`}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Info */}
        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          👋 {isGuest ? "Guest" : user?.name}
        </span>

        {/* Login/Logout Button */}
        {isGuest ? (
          <button
            onClick={onShowLogin}
            className={`text-sm px-3 py-1 rounded ${
              darkMode
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-colors`}
          >
            Login
          </button>
        ) : (
          <button
            onClick={logout}
            className={`text-sm px-3 py-1 rounded ${
              darkMode
                ? "bg-red-700 hover:bg-red-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            } transition-colors`}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};
