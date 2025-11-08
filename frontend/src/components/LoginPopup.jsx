import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPopup({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      login({ user: data.user, token: data.token });
      onClose(); // ✅ close popup after login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 text-white p-6 rounded-xl w-80 space-y-4 shadow-lg"
      >
        <h2 className="text-xl font-bold text-center">Login to Continue</h2>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
          required
        />

        <div className="flex justify-between mt-2">
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
