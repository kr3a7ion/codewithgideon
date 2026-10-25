import React, { useState } from "react";
import { BadgeCheck, KeyRound, ShieldAlert } from "lucide-react";
import { mbtn } from "../../../marketing/ui";
import { useContactLinks } from "../../../marketing/useContactLinks";
import { auth } from "../../../../services/firebase";
import { Card, Notice, Spinner } from "../../shared/ui";
import { TextField } from "../../join/ui";

const friendly = (code: string) =>
  code.includes("wrong-password") || code.includes("invalid-credential")
    ? "Your current password isn't right."
    : code.includes("weak-password")
      ? "Choose a stronger password (at least 8 characters)."
      : code.includes("too-many-requests")
        ? "Too many tries. Wait a few minutes and try again."
        : code.includes("requires-recent-login")
          ? "For safety, sign out and back in, then change your password."
          : "We couldn't change your password. Please try again.";

/** How the student signs in, password change, and account deletion. */
export const SecurityCard: React.FC = () => {
  const { whatsapp } = useContactLinks();
  const user = auth.currentUser as any;
  const providers: string[] = (user?.providerData || []).map((p: any) => String(p?.providerId || ""));
  const google = providers.includes("google.com");
  const password = providers.includes("password") || !providers.length;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (form.next.length < 8) return setMsg({ tone: "error", text: "Your new password needs at least 8 characters." });
    if (form.next !== form.confirm) return setMsg({ tone: "error", text: "The two new passwords don't match." });
    setBusy(true);
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, form.current));
      await updatePassword(user, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setOpen(false);
      setMsg({ tone: "success", text: "Password changed." });
    } catch (err: any) {
      setMsg({ tone: "error", text: friendly(String(err?.code || err?.message || "")) });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setMsg(null);
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth as any, user.email);
      setMsg({ tone: "success", text: `We sent a reset link to ${user.email}.` });
    } catch {
      setMsg({ tone: "error", text: "We couldn't send the email. Please try again." });
    }
  };

  const deleteText = encodeURIComponent(`Hi Gideon, please delete my CodeWithGideon account (${user?.email || ""}).`);
  const deleteLink = whatsapp ? `${whatsapp}${whatsapp.includes("?") ? "&" : "?"}text=${deleteText}` : "";

  return (
    <Card as="section" aria-labelledby="account-security" className="space-y-4 p-5 sm:p-6">
      <h2 id="account-security" className="font-display text-lg font-semibold text-blue-900 dark:text-white">
        Sign-in and security
      </h2>
      <ul className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <li className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-teal-700 dark:text-teal-300" aria-hidden />
          You sign in with {google && password ? "Google or your email and password" : google ? "Google" : "your email and password"}
        </li>
        <li className="flex items-center gap-2">
          {user?.emailVerified ? <BadgeCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" aria-hidden /> : <ShieldAlert className="h-4 w-4 text-orange-600" aria-hidden />}
          {user?.emailVerified ? "Email verified" : "Email not verified yet"}
        </li>
      </ul>

      {msg ? (
        <Notice tone={msg.tone} role="status">
          {msg.text}
        </Notice>
      ) : null}

      {password && user?.email ? (
        open ? (
          <form onSubmit={change} noValidate className="space-y-3">
            <TextField label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} />
            <TextField label="New password" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} helper="At least 8 characters." />
            <TextField label="Repeat new password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={busy || !form.current} className={mbtn({ kind: "learn" })}>
                {busy ? <Spinner /> : null} Change password
              </button>
              <button type="button" onClick={() => setOpen(false)} className={mbtn({ kind: "secondary" })}>
                Cancel
              </button>
            </div>
            <button type="button" onClick={reset} className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">
              Forgot your current password? Email me a reset link
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className={mbtn({ kind: "secondary", full: true })}>
            Change password
          </button>
        )
      ) : null}

      <p className="border-t border-line pt-4 text-[13px] font-medium text-slate-500 dark:border-line-dark dark:text-slate-400">
        Want your account and data deleted?{" "}
        {deleteLink ? (
          <a href={deleteLink} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-700 hover:underline dark:text-teal-300">
            Ask Gideon on WhatsApp
          </a>
        ) : (
          "Message Gideon"
        )}
        . Payment records are kept for accounting.
      </p>
    </Card>
  );
};
