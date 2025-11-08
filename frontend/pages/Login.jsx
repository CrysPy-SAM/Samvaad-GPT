import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API = "http://localhost:8080/api/auth";

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState("email"); // "email" or "phone"
  const [form, setForm] = useState({ email: "", password: "", phone: "", code: "" });
  const [step, setStep] = useState("enter"); // enter -> verify
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("verify");
      setMsg("OTP sent successfully!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: form.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Login to SamvaadGPT</h1>

      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 p-2 rounded ${mode === "email" ? "bg-blue-600" : "bg-gray-700"}`}
            onClick={() => setMode("email")}
          >
            Email Login
          </button>
          <button
            className={`flex-1 p-2 rounded ${mode === "phone" ? "bg-blue-600" : "bg-gray-700"}`}
            onClick={() => setMode("phone")}
          >
            Phone OTP
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 bg-gray-700 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 bg-gray-700 rounded"
              required
            />
            {msg && <p className="text-sm text-red-400">{msg}</p>}
            <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {step === "enter" ? (
              <>
                <input
                  type="tel"
                  placeholder="Phone (e.g. +9198xxxxxxx)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded"
                />
                <button
                  className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded"
                />
                <button
                  className="w-full bg-green-600 p-2 rounded hover:bg-green-500"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}
            {msg && <p className="text-sm text-blue-400">{msg}</p>}
          </div>
        )}
      </div>

      <p className="text-gray-400 mt-4 text-sm">
        Don’t have an account? <a href="/register" className="text-blue-400 underline">Register</a>
      </p>
    </div>
  );
}
