import React, { useState } from "react";
import { View } from "../App";
import { registrationStore } from "../services/registrationStore";

interface StudentLoginProps {
  onNavigate: (view: View) => void;
  onLoginSuccess?: (uid: string) => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const uid = await registrationStore.login(email.trim(), password);
      onLoginSuccess?.(uid);
      onNavigate("student-dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email first, then tap 'Forgot password'.");
      return;
    }

    setLoading(true);
    try {
      await registrationStore.resetPassword(email.trim());
      setMessage("Password reset link sent. Check your email.");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-3">
            Student Login
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in with the email & password you used during registration.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold border border-teal-100">
                {message}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors text-sm font-bold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
              >
                Forgot password?
              </button>

              <button
                type="button"
                onClick={() => onNavigate("registration")}
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
              >
                Create account
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="w-full mt-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;