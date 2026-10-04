import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import type { View } from "../../app/views";
import { registrationStore } from "../../../services/registrationStore";
import { mbtn } from "../../marketing/ui";
import { Card, Notice, Spinner } from "../shared/ui";
import { JoinLayout } from "./JoinLayout";
import { GoogleButton, JoinTitle, OrDivider, TextField } from "./ui";

type Result = { success: boolean; error?: string };

const authMessage = (err: any) => {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("user-not-found")) return "There's no account for this email yet. Create one instead.";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "That email and password don't match. Try again or reset your password.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a minute, then try again.";
  if (code.includes("network-request-failed") || msg.toLowerCase().includes("network")) return "We couldn't reach the server. Check your connection and try again.";
  return msg || "Sign-in didn't work. Please try again.";
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** /student/login, and shown in place of any student page when signed out. */
const LoginPage: React.FC<{
  onNavigate: (view: View) => void;
  onLogin?: (email: string, password: string) => Promise<Result>;
  onGoogleAuth?: () => Promise<Result>;
}> = ({ onNavigate, onLogin, onGoogleAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"login" | "google" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [banner, setBanner] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("cwg_account_created") || "null");
      if (data?.email) {
        setEmail(String(data.email));
        setBanner("Your account is ready. Log in to carry on where you left off.");
      }
    } catch {
      // ignore
    }
  }, []);

  const trimmed = useMemo(() => email.trim(), [email]);
  const emailError = touched && trimmed && !isEmail(trimmed) ? "Enter a valid email address." : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    setMessage("");
    if (!isEmail(trimmed)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setBusy("login");
    try {
      const res = await onLogin?.(trimmed, password);
      if (res && !res.success) setError(res.error || "Sign-in didn't work. Please try again.");
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError("");
    setMessage("");
    setBusy("google");
    try {
      const res = await onGoogleAuth?.();
      if (res && !res.success) setError(res.error || "Google sign-in didn't finish. Please try again.");
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const forgot = async () => {
    setError("");
    setMessage("");
    if (!isEmail(trimmed)) {
      setTouched(true);
      return setError("Enter your email above first, then tap “Forgot password?”.");
    }
    setBusy("reset");
    try {
      await registrationStore.resetPassword(trimmed);
      setMessage(`We sent a reset link to ${trimmed}. Check your inbox and spam folder.`);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <JoinLayout width="narrow">
      <Card className="space-y-[18px] p-5 sm:p-8 sm:pt-9">
        <JoinTitle title="Welcome back">Log in to join your classes and catch up on recordings.</JoinTitle>
        {banner && !error && !message ? <Notice tone="success">{banner}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? (
          <Notice tone="success" role="status">
            {message}
          </Notice>
        ) : null}
        <GoogleButton onClick={google} loading={busy === "google"} disabled={!!busy || !onGoogleAuth} />
        <OrDivider label="or" />
        <form onSubmit={submit} noValidate className="space-y-[18px]">
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            error={emailError}
            disabled={busy === "login"}
          />
          <TextField
            label="Password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy === "login"}
            labelAside={
              <button type="button" onClick={forgot} disabled={!!busy} className="text-sm font-bold text-teal-700 hover:underline disabled:opacity-60 dark:text-teal-300">
                {busy === "reset" ? "Sending…" : "Forgot password?"}
              </button>
            }
            trailing={
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
          />
          <button type="submit" disabled={!!busy} className={mbtn({ kind: "learn", size: "lg", full: true })}>
            {busy === "login" ? (
              <>
                <Spinner /> Logging in…
              </>
            ) : (
              <>
                Log in <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
        </form>
      </Card>
      <p className="text-center text-base text-slate-600 dark:text-slate-300">
        New here?{" "}
        <button type="button" onClick={() => onNavigate("create-account")} className="font-bold text-teal-700 hover:underline dark:text-teal-300">
          Create an account
        </button>
      </p>
    </JoinLayout>
  );
};

export default LoginPage;
