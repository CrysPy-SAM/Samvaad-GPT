import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function LoginPopup({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("phone"); // "phone" | "email"
  const [step, setStep] = useState("send"); // "send" | "verify"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async () => {
    if (!phone.trim()) return setError("Phone number required");
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/send-otp`, { phone });
      if (res.data.success) {
        setMessage("OTP sent successfully!");
        setStep("verify");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phone || !otp) return setError("Phone and OTP required");
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { phone, otp });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLoginSuccess?.(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return setError("Email and password required");
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLoginSuccess?.(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-[#111827] text-white rounded-2xl p-6 w-[360px] shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-semibold mb-3 text-center">
          Welcome Back 👋
        </h2>

        <div className="flex justify-center gap-3 mb-5">
          <button
            className={`px-4 py-2 rounded-md ${
              mode === "phone" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => {
              setMode("phone");
              setError("");
            }}
          >
            📱 Phone
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              mode === "email" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => {
              setMode("email");
              setError("");
            }}
          >
            📧 Email
          </button>
        </div>

        {error && (
          <div className="bg-red-700 text-sm text-center py-2 rounded-md mb-3">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-700 text-sm text-center py-2 rounded-md mb-3">
            {message}
          </div>
        )}

        {mode === "phone" && (
          <>
            {step === "send" && (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
                />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
                />
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-md"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {step === "verify" && (
              <>
                <input
                  type="text"
                  value={phone}
                  readOnly
                  className="w-full mb-3 p-2 rounded-md bg-gray-700 text-gray-300"
                />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-md"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => setStep("send")}
                  className="w-full text-sm mt-3 text-blue-400 hover:text-blue-300"
                >
                  Change Phone Number
                </button>
              </>
            )}
          </>
        )}

        {mode === "email" && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
            />
            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-md"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
