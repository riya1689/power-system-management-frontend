"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-sm">Sign in to SCADA System</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockKeyhole className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-semibold tracking-wide transition-all shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
