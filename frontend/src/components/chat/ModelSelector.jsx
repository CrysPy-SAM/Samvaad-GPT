import React from "react";

function ModelSelector({ selectedModel, onModelChange, darkMode }) {
  const models = [
    { id: "fast", label: "⚡ Fast (Groq Mixtral)" },
    { id: "creative", label: "🎨 Creative(Gemini)" },
  ];

  return (
    <div className="flex items-center gap-2 justify-center">
      <label
        className={`text-sm font-medium ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
      </label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className={`px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200
          ${darkMode
            ? "bg-gray-900 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-800"
          }`}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
