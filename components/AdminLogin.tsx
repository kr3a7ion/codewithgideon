import React, { useMemo, useState } from "react";
import { View } from "../src/App";

interface AdminLoginProps {
  onNavigate: (view: View) => void;
  onLogin: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Small UI helper (same style as your other pages)
  const InlineSpinner = useMemo(
    () =>
      function InlineSpinner({ label }: { label?: string }) {
        return (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-white animate-spin" />
            {label ? <span>{label}</span> : null}
          </span>
        );
      },
    [],
  );

  const normalizeAdminError = (raw?: string) => {
    const msg = (raw || "").toLowerCase();

    // ✅ Friendly messages (works even if onLogin passes Firebase error text)
    if (
      msg.includes("wrong-password") ||
      msg.includes("invalid-credential") ||
      msg.includes("invalid login credentials") ||
      msg.includes("invalid password")
    ) {
      return "Incorrect email or password.";
    }

    if (msg.includes("user-not-found") || msg.includes("no user record")) {
      return "No admin account found with this email.";
    }

    if (msg.includes("too-many-requests")) {
      return "Too many attempts. Please wait a bit and try again.";
    }

    if (msg.includes("network") || msg.includes("failed to fetch")) {
      return "Network error. Please check your internet and try again.";
    }

    if (msg.includes("permission") || msg.includes("not authorized")) {
      return "You’re not authorized to access the admin portal.";
    }

    return raw || "Login failed. Please check your credentials.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // ✅ Basic front-end validation (prevents weird blank submissions)
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onLogin(cleanEmail, password);

      if (!result.success) {
        setError(normalizeAdminError(result.error));
        return;
      }

      // ✅ success: parent decides where to go next (keeps your flow)
      // (If you want auto-route here later, we can add it — but I won’t change behavior now.)
    } catch (err: any) {
      setError(normalizeAdminError(err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 dark:bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-blue-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Authenticated by Firebase
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              inputMode="email"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium"
              placeholder="admin@codewithgideon.com"
              disabled={isSubmitting}
            />
          </div>

          {/* Password Input with Show/Hide */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium pr-12"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isSubmitting}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors disabled:opacity-60"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.122 5.122M17.657 17.657L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <InlineSpinner label="Authenticating..." />
            ) : (
              "Enter Dashboard"
            )}
          </button>
        </form>

        {/* Navigate Home */}
        <button
          onClick={() => onNavigate("home")}
          disabled={isSubmitting}
          className="w-full mt-6 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 text-xs font-bold transition-colors disabled:opacity-60"
        >
          Return to platform
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
