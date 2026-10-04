import React, { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Info, MailOpen } from "lucide-react";
import type { View } from "../../app/views";
import { useApp } from "../../app/AppContext";
import { mbtn } from "../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../marketing/useContactLinks";
import { Card, IconTile, Notice, Spinner } from "../shared/ui";
import { readJoinCourse } from "./joinCourse";
import { JoinLayout } from "./JoinLayout";
import { CourseSummary } from "./ui";
import { useJoinCourses } from "./useJoinCourses";

const RESEND_SECONDS = 60;
const POLL_MS = 4000;

/** A web inbox link for common providers, so phones can jump straight there. */
const inboxFor = (email: string): { label: string; href: string } | null => {
  const domain = String(email.split("@")[1] || "").toLowerCase();
  if (["gmail.com", "googlemail.com"].includes(domain)) return { label: "Open Gmail", href: "https://mail.google.com/mail/u/0/#inbox" };
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) return { label: "Open Outlook", href: "https://outlook.live.com/mail/0/inbox" };
  if (domain.startsWith("yahoo.")) return { label: "Open Yahoo Mail", href: "https://mail.yahoo.com" };
  if (["icloud.com", "me.com"].includes(domain)) return { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" };
  return null;
};

/**
 * Join step 1b: /student/verify-email. Checks every few seconds (and when the
 * tab regains focus) so the student moves on by themselves once they've
 * tapped the link in their email.
 */
const VerifyEmailPage: React.FC<{
  role: "admin" | "student";
  email: string;
  onNavigate: (view: View) => void;
  onRefresh: () => Promise<{ verified: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onLogout: () => Promise<void>;
}> = ({ role, email, onNavigate, onRefresh, onResend, onLogout }) => {
  const { selectedPath } = useApp();
  const { nextCohortDate } = useContactLinks();
  const courses = useJoinCourses(selectedPath || readJoinCourse());
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const inbox = inboxFor(email);

  const check = useCallback(
    async (manual: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (manual) {
        setChecking(true);
        setError("");
        setMessage("");
      }
      try {
        const res = await onRefresh();
        if (res.verified) setMessage("Confirmed. Taking you to the next step…");
        else if (manual) setError("We can't see the confirmation yet. Tap the link in the email, then try again.");
      } finally {
        inFlight.current = false;
        if (manual) setChecking(false);
      }
    },
    [onRefresh],
  );

  // Quiet checks while the tab is visible, and straight away on focus.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void check(false);
    };
    const id = window.setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [check]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  const resend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await onResend();
      if (res.success) {
        setMessage(`We sent a new link to ${email}.`);
        setSeconds(RESEND_SECONDS);
      } else setError(res.error || "We couldn't send another email. Try again in a minute.");
    } finally {
      setResending(false);
    }
  };

  const differentEmail = async () => {
    setLeaving(true);
    try {
      await onLogout();
      onNavigate(role === "admin" ? "admin-login" : "create-account");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <JoinLayout
      step={role === "student" ? 1 : undefined}
      aside={
        role === "student" ? (
          <CourseSummary course={courses.selected} loading={courses.loading} nextCohort={upcomingCohortLabel(nextCohortDate)} />
        ) : undefined
      }
      width="narrow"
    >
      <Card className="space-y-5 p-5 pt-7 sm:p-8 sm:pt-10">
        <IconTile icon={MailOpen} size="lg" />
        <div className="space-y-3">
          <h1 className="font-display text-[30px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[40px] sm:leading-[46px]">
            Check your email
          </h1>
          <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
            We sent a link to <strong className="break-all font-bold text-blue-900 dark:text-white">{email || "your email"}</strong>. Open it, then come
            back to this tab. You'll move to the next step on your own once it's confirmed.
          </p>
        </div>
        {message ? (
          <Notice tone="success" role="status">
            {message}
          </Notice>
        ) : error ? (
          <Notice tone="error">{error}</Notice>
        ) : (
          <p className="inline-flex items-center gap-2.5 rounded-xl bg-paper px-3.5 py-2.5 text-sm font-semibold text-slate-600 dark:bg-paper-dark dark:text-slate-300" role="status">
            <Spinner className="text-teal-600 dark:text-teal-400" /> Waiting for you to confirm…
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          {inbox ? (
            <a href={inbox.href} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "learn", size: "lg", className: "w-full sm:w-auto" })}>
              {inbox.label} <ExternalLink className="h-[18px] w-[18px]" aria-hidden />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => void check(true)}
            disabled={checking}
            className={mbtn({ kind: inbox ? "secondary" : "learn", size: "lg", className: "w-full sm:w-auto" })}
          >
            {checking ? (
              <>
                <Spinner /> Checking…
              </>
            ) : (
              "I've confirmed it"
            )}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm font-semibold sm:justify-start">
          <button type="button" onClick={resend} disabled={seconds > 0 || resending} className="text-blue-900 hover:underline disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline dark:text-white disabled:dark:text-slate-400">
            {resending ? "Sending…" : seconds > 0 ? `Resend email in 0:${String(seconds).padStart(2, "0")}` : "Resend email"}
          </button>
          <button type="button" onClick={differentEmail} disabled={leaving} className="font-bold text-blue-900 hover:underline dark:text-white">
            Use a different email
          </button>
        </div>
      </Card>
      <p className="flex items-start gap-2.5 px-1 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
        Can't find it? Check Spam or Promotions. The email comes from CodeWithGideon.
      </p>
    </JoinLayout>
  );
};

export default VerifyEmailPage;
