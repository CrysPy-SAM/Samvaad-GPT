import React from "react";
import { Loader2 } from "lucide-react";

export const Loader = ({ size = 24, className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-blue-500" />
    </div>
  );
};

export const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <Loader size={48} />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
};