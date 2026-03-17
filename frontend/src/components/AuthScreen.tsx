"use client";

import { useState } from "react";

interface AuthScreenProps {
  onLogin: (token: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("forge_token", data.token);
        onLogin(data.token);
      } else {
        alert(data.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-orange-500 font-black text-2xl mb-6 tracking-tighter uppercase text-center">Enter the Forge</h1>
        <input
          type="email" placeholder="Email" required
          className="w-full bg-black border border-zinc-800 p-3 rounded-lg mb-4 text-sm text-orange-500 placeholder:text-zinc-700 focus:border-orange-500 outline-none transition-all"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password" placeholder="Password" required
          className="w-full bg-black border border-zinc-800 p-3 rounded-lg mb-6 text-sm text-orange-500 placeholder:text-zinc-700 focus:border-orange-500 outline-none transition-all"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors">
          {loading ? "Forging Access..." : "Authenticate"}
        </button>
      </form>
    </main>
  );
}