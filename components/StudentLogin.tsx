import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Code2,
  LogIn,
} from "lucide-react";
import { View } from "../src/App";
import AuthStatusCard from "./AuthStatusCard";
import GoogleAuthButton from "./GoogleAuthButton";
import { registrationStore } from "../services/registrationStore";

interface StudentLoginProps {
  onNavigate: (view: View) => void;

  // ✅ matches useAppLogic.loginStudent(email,password) return shape
  onLogin?: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onGoogleAuth?: () => Promise<{ success: boolean; error?: string }>;
}

const StudentLogin: React.FC<StudentLoginProps> = ({
  onNavigate,
  onLogin,
  onGoogleAuth,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [banner, setBanner] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cwg_account_created");
      if (!raw) return;
      const data = JSON.parse(raw);
      const em = String(data?.email || "").trim();
      if (em) setEmail(em);
      setBanner(
        data?.verificationRequired
          ? "Account created. Verify your email, then sign in to continue registration."
          : "Account created successfully. Please login to continue registration.",
      );
    } catch {}
  }, []);

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  }, [trimmedEmail]);

  const InlineSpinner = ({ label }: { label?: string }) => (
    <span className="inline-flex items-center gap-2 justify-center">
      <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      {label ? <span className="font-bold">{label}</span> : null}
    </span>
  );

  const humanizeAuthError = (err: any) => {
    const code = err?.code || "";
    const msg = String(err?.message || "");

    if (code.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("auth/user-not-found")) {
      return "No account found for this email. Please create an account.";
    }
    if (code.includes("auth/wrong-password")) {
      return "Incorrect password. Please try again.";
    }
    if (code.includes("auth/invalid-credential")) {
      return "Incorrect email or password. Please try again.";
    }
    if (code.includes("auth/too-many-requests")) {
      return "Too many attempts. Please wait a bit and try again.";
    }
    if (code.includes("auth/network-request-failed")) {
      return "Network error. Check your connection and try again.";
    }
    if (code.includes("auth/popup-closed-by-user")) {
      return "Google sign-in was cancelled before it finished.";
    }
    if (code.includes("auth/popup-blocked")) {
      return "Google sign-in was blocked. Please allow pop-ups and try again.";
    }
    if (code.includes("auth/account-exists-with-different-credential")) {
      return "This email already uses another sign-in method. Use that sign-in method first.";
    }
    if (code.includes("auth/operation-not-allowed")) {
      return "Google sign-in is not enabled yet. Please contact support.";
    }

    if (msg.toLowerCase().includes("network")) {
      return "Network error. Please check your connection and try again.";
    }

    return msg || "Login failed. Please try again.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

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

    setLoading(true);
    try {
      if (!onLogin) throw new Error("Login handler not provided.");

      const res = await onLogin(trimmedEmail, password);

      if (res && res.success === false) {
        throw new Error(res.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setMessage("");
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

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!trimmedEmail) {
      setError("Enter your email first, then tap 'Forgot password'.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address to receive a reset link.");
      return;
    }

    setLoading(true);
    try {
      await registrationStore.resetPassword(trimmedEmail);
      setMessage(
        "Password reset link sent. Check your email inbox (and spam).",
      );
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
              <GraduationCap className="text-white w-7 h-7" />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              Log in to your student portal to continue your learning journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <AnimatePresence mode="wait">
              {banner && (
                <motion.div
                  key="banner"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <AuthStatusCard tone="info" message={banner} />
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

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <AuthStatusCard tone="success" message={message} />
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
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="name@example.com"
                />
              </div>

              {!!trimmedEmail && !isEmailValid && (
                <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1 gap-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
                >
                  {loading ? "Please wait…" : "Forgot password?"}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <InlineSpinner label="Signing in…" />
              ) : (
                <>
                  <span>Sign In</span>
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
                onClick={() => onNavigate("create-account")}
                disabled={loading}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60"
              >
                Create Account
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
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => onNavigate("create-account")}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Create one here
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
              <span>Student Exclusive</span>
            </div>

            <h2 className="text-5xl font-black leading-tight mb-8">
              Your future in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                code starts here.
              </span>
            </h2>

            <div className="space-y-8 max-w-xl">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Code2 className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Live Mentorship</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Get real-time feedback from experienced mentors who care
                    about your growth.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <LogIn className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Track Progress</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Monitor your learning milestones and stay in sync with your
                    cohort schedule.
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
                <span className="text-pink-400">const</span> student = {"{"}
              </p>
              <p className="ml-4">
                name: <span className="text-teal-400">"Future Dev"</span>,
              </p>
              <p className="ml-4">
                status: <span className="text-teal-400">"Learning"</span>,
              </p>
              <p className="ml-4">
                goal: <span className="text-teal-400">"Mastery"</span>
              </p>
              <p>{"};"}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
