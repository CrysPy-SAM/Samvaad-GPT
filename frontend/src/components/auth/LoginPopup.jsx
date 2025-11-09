import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { authAPI } from "../../api/auth.api";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../common/Input";
import { Button } from "../common/Button";

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

  // Email Login/Register
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

    try {
      await authAPI.sendOTP(form.phone);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-2xl p-8 w-[380px] relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-100 text-xl"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-3">
          {isRegister ? "Create Account" : "Welcome Back"} 👋
        </h2>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => {
              setMode("phone");
              setIsOTPSent(false);
              setError("");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "phone"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            📱 Phone
          </button>
          <button
            onClick={() => {
              setMode("email");
              setError("");
              setIsOTPSent(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "email"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            📧 Email
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Phone Login */}
        {mode === "phone" && (
          <form
            onSubmit={isOTPSent ? handleVerifyOTP : handleSendOTP}
            className="flex flex-col gap-3"
          >
            {!isOTPSent && (
              <Input
                type="text"
                name="name"
                placeholder="Your Name (Optional)"
                value={form.name}
                onChange={handleChange}
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
              {isOTPSent ? "Verify OTP" : "Send OTP"}
            </Button>

            <button
              onClick={onClose}
              type="button"
              className="text-sm text-gray-400 mt-1 hover:text-gray-200"
            >
              Cancel
            </button>
          </form>
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
              {isRegister ? "Create Account" : "Login"}
            </Button>

            <button
              onClick={onClose}
              type="button"
              className="text-sm text-gray-400 mt-1 hover:text-gray-200"
            >
              Cancel
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-900 text-gray-400">
                  {isRegister ? "Already have an account?" : "New to SamvaadGPT?"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-center text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              {isRegister ? "Login Instead" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
