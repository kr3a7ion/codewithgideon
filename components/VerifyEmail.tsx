import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  LogOut,
  MailCheck,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { View } from "../src/App";

interface VerifyEmailProps {
  role: "admin" | "student";
  email: string;
  onNavigate: (view: View) => void;
  onRefresh: () => Promise<{ verified: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onLogout: () => Promise<void>;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({
  role,
  email,
  onNavigate,
  onRefresh,
  onResend,
  onLogout,
}) => {
  const [busyAction, setBusyAction] = useState<"refresh" | "resend" | "logout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const roleLabel = useMemo(
    () =>
      role === "admin"
        ? {
            title: "Verify your admin email",
            subtitle:
              "Admin access unlocks only after this email address is verified.",
            backView: "admin-login" as View,
          }
        : {
            title: "Verify your email first",
            subtitle:
              "Your student account is created. Verify this email before continuing registration.",
            backView: "student-login" as View,
          },
    [role],
  );

  const handleRefresh = async () => {
    setBusyAction("refresh");
    setError("");
    setMessage("");

    try {
      const result = await onRefresh();
      if (!result.verified) {
        setError(
          result.error ||
            "We still do not see a verified email. Open the link in your inbox, then try again.",
        );
        return;
      }

      setMessage("Email verified. Redirecting you now...");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResend = async () => {
    setBusyAction("resend");
    setError("");
    setMessage("");

    try {
      const result = await onResend();
      if (!result.success) {
        setError(result.error || "Could not resend the verification email.");
        return;
      }

      setMessage("A fresh verification email has been sent.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = async () => {
    setBusyAction("logout");
    try {
      await onLogout();
      onNavigate(roleLabel.backView);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-10 sm:py-12 z-10 bg-white dark:bg-slate-950"
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8 sm:mb-10">
            <div className="w-14 h-14 bg-blue-600 dark:bg-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
              <MailCheck className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              {roleLabel.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              {roleLabel.subtitle}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5 sm:p-6 mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Verification Inbox
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white break-all">
              {email || "Signed-in email"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              We keep this step explicit so both learner accounts and admin access
              stay tied to a real, verified inbox.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="verify-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-4 rounded-2xl border bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200"
              >
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {message ? (
              <motion.div
                key="verify-message"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-4 rounded-2xl border bg-teal-50 border-teal-100 text-teal-800 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-200"
              >
                <p className="text-sm font-medium leading-relaxed">{message}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busyAction !== null}
              className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {busyAction === "refresh" ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>I&apos;ve Verified My Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={busyAction !== null}
              className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busyAction === "resend" ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-100 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={17} />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={busyAction !== null}
              className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busyAction === "logout" ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-100 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut size={17} />
                  <span>Use a Different Email</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-bold text-blue-600 dark:text-teal-300 hover:underline inline-flex items-center gap-2"
            >
              <span>Back to sign in</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-[-8%] left-[-8%] w-[58%] h-[58%] rounded-full bg-blue-600 blur-[120px]" />
          <div className="absolute bottom-[-12%] right-[-8%] w-[55%] h-[55%] rounded-full bg-teal-500 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wider uppercase mb-8">
            <ShieldCheck size={14} className="text-teal-300" />
            <span>Verified Access</span>
          </div>

          <h2 className="text-5xl font-black leading-tight mb-8">
            Secure access
            <br />
            starts with email trust.
          </h2>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5 max-w-xl">
            <p className="text-sm text-slate-200 leading-relaxed">
              This keeps learner records, mentor replies, and admin access tied
              to a verified identity before any protected view opens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
