import { useState } from "react";

const API = "http://localhost:8080/api/auth/register";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("✅ Registered successfully! Please login.");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Create an Account</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-full max-w-sm space-y-3">
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        {msg && <p className="text-blue-400 text-sm">{msg}</p>}
        <button className="w-full bg-green-600 p-2 rounded hover:bg-green-500">Register</button>
      </form>
      <p className="text-gray-400 mt-4 text-sm">
        Already have an account? <a href="/login" className="text-blue-400 underline">Login</a>
      </p>
    </div>
  );
}
