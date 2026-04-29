import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Server,
  Terminal,
} from "lucide-react";
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

  const InlineSpinner = useMemo(
    () =>
      function InlineSpinner({ label }: { label?: string }) {
        return (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            {label ? <span>{label}</span> : null}
          </span>
        );
      },
    [],
  );

  const normalizeAdminError = (raw?: string) => {
    const msg = (raw || "").toLowerCase();

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

    if (msg.includes("admin record missing") || msg.includes("admins/")) {
      return "This account signed in successfully, but it does not have a matching admins/{uid} Firestore record yet.";
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
    } catch (err: any) {
      setError(normalizeAdminError(err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Side: Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-10 sm:py-12 z-10 bg-white dark:bg-slate-950"
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="w-12 h-12 bg-slate-900 dark:bg-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20"
            >
              <ShieldCheck className="text-white w-7 h-7" />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Admin Access
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              Authorized personnel only. Please verify your identity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Admin Email
              </label>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>

                <input
                  required
                  type="email"
                  value={email}
                  inputMode="email"
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
                  placeholder="mail@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Secure Password
                </label>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="admin-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3"
                >
                  <ShieldAlert className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <InlineSpinner label="Authenticating..." />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              disabled={isSubmitting}
              className="text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-60"
            >
              Return to Platform
            </button>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Decorative/Info */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #334155 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 backdrop-blur-md border border-teal-500/20 text-xs font-bold tracking-wider uppercase mb-8 text-teal-400">
              <Server size={14} />
              <span>System Administration</span>
            </div>

            <h2 className="text-5xl font-black leading-tight mb-8">
              Manage the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                CodeWithGideon Ecosystem.
              </span>
            </h2>

            <div className="space-y-8 max-w-xl">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Terminal className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Student Management</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Review registrations, verify payments, and manage cohort
                    assignments.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <ShieldCheck className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Secure Environment</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    All administrative actions are logged and secured via
                    Firebase Auth.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute bottom-12 right-12 w-80 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                System Status
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase">
                  Online
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-teal-500 rounded-full" />
              </div>

              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>DATABASE LOAD</span>
                <span>75%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
