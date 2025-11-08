// import { useState } from "react";

// export default function Register() {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");
//     const res = await fetch("http://localhost:8080/api/auth/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form),
//     });
//     const data = await res.json();
//     if (res.ok) setMessage("✅ Registered successfully! Please login.");
//     else setMessage(data.error || "Registration failed");
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
//       <h2 className="text-2xl font-bold mb-4">Create an Account</h2>
//       <form onSubmit={handleSubmit} className="w-80 space-y-4">
//         <input type="text" placeholder="Name" value={form.name}
//           onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
//         <input type="email" placeholder="Email" value={form.email}
//           onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
//         <input type="password" placeholder="Password" value={form.password}
//           onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
//         {message && <p className="text-blue-400 text-sm">{message}</p>}
//         <button className="w-full bg-green-600 p-2 rounded hover:bg-green-500">Register</button>
//       </form>
//     </div>
//   );
// }
