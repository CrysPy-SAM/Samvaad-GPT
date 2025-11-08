// import { useState } from "react";

// export default function Login({ onLogin }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       const res = await fetch("http://localhost:8080/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Login failed");

//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));
//       onLogin(data.user);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
//       <h2 className="text-2xl font-bold mb-4">Login to SamvaadGPT</h2>
//       <form onSubmit={handleSubmit} className="w-80 space-y-4">
//         <input type="email" placeholder="Email" value={email}
//           onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded bg-gray-800" />
//         <input type="password" placeholder="Password" value={password}
//           onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded bg-gray-800" />
//         {error && <p className="text-red-400 text-sm">{error}</p>}
//         <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500">Login</button>
//       </form>
//     </div>
//   );
// }
