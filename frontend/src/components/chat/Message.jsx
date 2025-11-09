import React, { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";

export const Message = ({ message, isUser }) => {
  const { darkMode } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis not supported in this browser.");
      return;
    }

    // ✅ If already speaking → stop speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text || !text.trim()) return;

    // stop any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // only English
    utterance.rate = 1;
    utterance.pitch = 1;

    // find best english voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en")) ||
      voices.find((v) => v.name.toLowerCase().includes("english")) ||
      voices[0];
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-blue-600" : "bg-blue-500"
          } text-white font-bold text-sm`}
        >
          AI
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={`relative px-4 py-3 rounded-2xl ${
            isUser
              ? darkMode
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : darkMode
              ? "bg-gray-800 text-gray-100"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed pr-6">
            {message.content}
          </div>

          {/* 🔊 Speaker button */}
          {!isUser && (
            <button
              onClick={() => speak(message.content)}
              className={`absolute right-2 bottom-2 p-1 rounded-full transition ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title={isSpeaking ? "Stop speaking" : "Play message"}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>

        {message.timestamp && (
          <span
            className={`text-xs ${
              darkMode ? "text-gray-500" : "text-gray-600"
            } ${isUser ? "text-right" : "text-left"} px-2`}
          >
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

      {isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-700"
          } font-semibold text-xs`}
        >
          You
        </div>
      )}
    </div>
  );
};
