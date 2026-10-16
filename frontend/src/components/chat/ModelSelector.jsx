import React from "react";

function ModelSelector({ selectedModel, onModelChange, darkMode }) {
  const models = [
    { id: "fast", label: "⚡ Fast (Qwen 27B • 0.2s)" },
    { id: "pro", label: "🧠 Smart (GPT OSS 120B • 1s)" },
    { id: "creative", label: "🎨 Creative (Gemini Flash)" },
  ];

  return (
    <div className="flex items-center justify-center min-w-0">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className={`w-full max-w-[130px] sm:max-w-[180px] md:max-w-none text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 truncate cursor-pointer font-medium
          ${darkMode
            ? "bg-gray-900 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-800"
          }`}
        aria-label="Select AI Model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id} className="text-xs sm:text-sm">
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
