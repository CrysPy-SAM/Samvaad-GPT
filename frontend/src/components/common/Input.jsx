import React from "react";

export const Input = ({
  label,
  error,
  icon: Icon,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-gray-800 border border-gray-700
            text-white placeholder-gray-500
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${Icon ? "pl-10" : ""}
            ${error ? "border-red-500" : ""}
            ${className}
          `.trim()}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
