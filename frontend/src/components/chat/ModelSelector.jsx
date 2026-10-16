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
        className={`w-full max-w-[130px] sm:max-w-[190px] md:max-w-none text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-xl border focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all duration-200 truncate cursor-pointer font-medium shadow-2xs
          ${darkMode
            ? "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
            : "bg-gray-100/80 border-gray-200 text-gray-800 hover:bg-gray-100"
          }`}
        aria-label="Select AI Model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id} className={darkMode ? "bg-[#1f1f1f] text-white" : "bg-white text-gray-900"}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
