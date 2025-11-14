import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { authAPI } from "../../api/auth.api";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { motion, AnimatePresence } from "framer-motion";

export const LoginPopup = ({ onClose }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState("phone"); // 'phone' | 'email'
  const [isRegister, setIsRegister] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Email login/register
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = isRegister
        ? await authAPI.register(form)
        : await authAPI.login(form);
      login(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name before requesting OTP");
      setLoading(false);
      return;
    }

    try {
      await authAPI.sendOTP(form.phone, form.name);
      setIsOTPSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authAPI.verifyOTP(form.phone, form.otp, form.name);
      login(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-[380px] bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 text-white border border-gray-800"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={22} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">
            {isRegister ? "Create Your Account" : "Welcome Back"} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isRegister
              ? "Join Samvaad-GPT to start exploring."
              : "Login to continue your conversations."}
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex justify-center gap-2 mb-5">
          {["phone", "email"].map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setMode(opt);
                setIsOTPSent(false);
                setError("");
              }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                mode === opt
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {opt === "phone" ? "📱 Phone" : "📧 Email"}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-3 mb-3 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Phone Login */}
        {mode === "phone" && (
          <AnimatePresence mode="wait">
            <motion.form
              key={isOTPSent ? "otp" : "phone"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={isOTPSent ? handleVerifyOTP : handleSendOTP}
              className="flex flex-col gap-3"
            >
              {!isOTPSent && (
                <Input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              )}

              <Input
                type="tel"
                name="phone"
                placeholder="Phone (e.g., 9876543210)"
                value={form.phone}
                onChange={handleChange}
                required
                disabled={isOTPSent}
              />

              {isOTPSent && (
                <>
                  <Input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={form.otp}
                    onChange={handleChange}
                    maxLength={6}
                    required
                    className="text-center text-xl tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOTPSent(false);
                      setForm({ ...form, otp: "" });
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 text-center"
                  >
                    Change Phone Number
                  </button>
                </>
              )}

              <Button type="submit" loading={loading} fullWidth>
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : isOTPSent ? (
                  "Verify OTP"
                ) : (
                  "Send OTP"
                )}
              </Button>
            </motion.form>
          </AnimatePresence>
        )}

        {/* Email Login */}
        {mode === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            )}
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />

            <Button type="submit" loading={loading} fullWidth>
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Login"
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              {isRegister
                ? "Already have an account?"
                : "New to SamvaadGPT?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isRegister ? "Login instead" : "Create one"}
              </button>
            </p>

            <button
              onClick={onClose}
              type="button"
              className="text-sm text-gray-500 mt-2 hover:text-gray-300 transition"
            >
              Cancel
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
