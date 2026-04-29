import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { View } from "../src/App";
import AuthStatusCard from "./AuthStatusCard";
import GoogleAuthButton from "./GoogleAuthButton";
import { registrationStore } from "../services/registrationStore";

interface CreateAccountProps {
  onNavigate: (view: View) => void;
  onGoogleAuth?: () => Promise<{ success: boolean; error?: string }>;
}

const CreateAccount: React.FC<CreateAccountProps> = ({
  onNavigate,
  onGoogleAuth,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail),
    [trimmedEmail],
  );

  const humanizeAuthError = (err: any) => {
    const code = String(err?.code || "").toLowerCase();
    const message = String(err?.message || "").trim();

    if (code.includes("email-already-in-use")) {
      return "An account already exists for this email. Sign in instead.";
    }
    if (code.includes("invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("weak-password")) {
      return "Password must be at least 6 characters.";
    }
    if (code.includes("popup-closed-by-user")) {
      return "Google sign-in was cancelled before it finished.";
    }
    if (code.includes("popup-blocked")) {
      return "Google sign-in was blocked. Please allow pop-ups and try again.";
    }
    if (code.includes("operation-not-allowed")) {
      return "Google sign-in is not enabled yet. Please contact support.";
    }
    if (code.includes("network-request-failed")) {
      return "Network error. Check your connection and try again.";
    }

    return message || "Account creation failed.";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // ✅ AUTH ONLY (no Firestore write here)
      const created = await registrationStore.createAuthOnly(
        trimmedEmail,
        password,
      );

      // ✅ flag to show ContinueRegistration after login
      localStorage.setItem(
        "cwg_account_created",
        JSON.stringify({
          email: created?.email || trimmedEmail,
          createdAt: Date.now(),
          verificationRequired: true,
        }),
      );

      setSuccess(
        "Account created. We sent a verification link to your email address.",
      );
      onNavigate("verify-email");
    } catch (err: any) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!onGoogleAuth) throw new Error("Google sign-in is not available.");
      const res = await onGoogleAuth();
      if (res && res.success === false) {
        throw new Error(res.error || "Google sign-in failed. Please try again.");
      }
    } catch (err: any) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 overflow-hidden">
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
              className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
            >
              <UserPlus className="text-white w-7 h-7" />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Create Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              Set up your student login to continue your registration journey.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5 sm:space-y-6">
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <AuthStatusCard tone="success" message={success} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <AuthStatusCard tone="error" message={error} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Email Address
              </label>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>

              {!!trimmedEmail && !isEmailValid && (
                <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Password
              </label>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {password && password.length < 6 ? (
                <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                  Minimum 6 characters required.
                </p>
              ) : null}
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Creating...</span>
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>

            <GoogleAuthButton
              loading={loading}
              disabled={loading}
              onClick={handleGoogleAuth}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate("student-login")}
                disabled={loading}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60"
              >
                Already Have Account
              </button>

              <button
                type="button"
                onClick={() => onNavigate("home")}
                disabled={loading}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60"
              >
                Back to Home
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => onNavigate("student-login")}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Decorative / Info */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wider uppercase mb-8">
              <Sparkles size={14} className="text-blue-400" />
              <span>Get Started</span>
            </div>

            <h2 className="text-5xl font-black leading-tight mb-8">
              Build your future <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                one step at a time.
              </span>
            </h2>

            <div className="space-y-8 max-w-xl">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Code2 className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Simple Start</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Create your account first, then continue into the full
                    registration process.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <CheckCircle2 className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Secure Access</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Your login is securely managed so you can return and
                    complete registration anytime.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ delay: 0.75, duration: 1 }}
            className="absolute bottom-12 right-12 w-80 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
          >
            <div className="flex gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>

            <div className="font-mono text-xs text-blue-300 space-y-1">
              <p>
                <span className="text-pink-400">const</span> account = {"{"}
              </p>
              <p className="ml-4">
                role: <span className="text-teal-400">"student"</span>,
              </p>
              <p className="ml-4">
                access: <span className="text-teal-400">"ready"</span>,
              </p>
              <p className="ml-4">
                next: <span className="text-teal-400">"registration"</span>
              </p>
              <p>{"};"}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
