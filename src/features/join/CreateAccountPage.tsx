import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import type { View } from "../../app/views";
import { useApp } from "../../app/AppContext";
import { registrationStore } from "../../../services/registrationStore";
import { mbtn } from "../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../marketing/useContactLinks";
import { Card, Notice, Spinner } from "../shared/ui";
import { readJoinCourse } from "./joinCourse";
import { JoinLayout } from "./JoinLayout";
import { CourseChip, CourseSummary, GoogleButton, JoinTitle, OrDivider, TextField } from "./ui";
import { useJoinCourses } from "./useJoinCourses";

type Result = { success: boolean; error?: string };

const MIN_PASSWORD = 8;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const signUpMessage = (err: any) => {
  const code = String(err?.code || "");
  if (code.includes("email-already-in-use")) return "There's already an account for this email. Log in instead.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("weak-password")) return `Use at least ${MIN_PASSWORD} characters for your password.`;
  if (code.includes("network-request-failed")) return "We couldn't reach the server. Check your connection and try again.";
  return String(err?.message || "") || "We couldn't create your account. Please try again.";
};

/** Join step 1: /register. */
const CreateAccountPage: React.FC<{ onNavigate: (view: View, data?: unknown) => void; onGoogleAuth?: () => Promise<Result> }> = ({
  onNavigate,
  onGoogleAuth,
}) => {
  const { isStudentLoggedIn, isLoadingAuth, studentProfile, selectedPath } = useApp();
  const { nextCohortDate } = useContactLinks();
  const preferred = selectedPath || readJoinCourse();
  const courses = useJoinCourses(preferred);
  const nextCohort = upcomingCohortLabel(nextCohortDate);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"create" | "google" | null>(null);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  // Already signed in (for example after picking a course on a course page):
  // carry on with the details step, or go to the dashboard once enrolled.
  useEffect(() => {
    if (isLoadingAuth || !isStudentLoggedIn) return;
    onNavigate(studentProfile?.status === "Complete" ? "student-dashboard" : "continue-registration", selectedPath || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, isStudentLoggedIn]);

  const trimmed = useMemo(() => email.trim(), [email]);
  const emailError = touched.email && trimmed && !isEmail(trimmed) ? "Enter a valid email address." : "";
  const passwordError =
    touched.password && password && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError("");
    if (!isEmail(trimmed)) return setError("Enter a valid email address.");
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
    setBusy("create");
    try {
      const created = await registrationStore.createAuthOnly(trimmed, password);
      try {
        localStorage.setItem(
          "cwg_account_created",
          JSON.stringify({ email: created?.email || trimmed, createdAt: Date.now(), verificationRequired: true }),
        );
      } catch {
        // ignore
      }
      onNavigate("verify-email");
    } catch (err) {
      setError(signUpMessage(err));
      setBusy(null);
    }
  };

  const google = async () => {
    setError("");
    setBusy("google");
    try {
      const res = await onGoogleAuth?.();
      if (res && !res.success) setError(res.error || "Google sign-in didn't finish. Please try again.");
    } catch (err) {
      setError(signUpMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const changeCourse = () => onNavigate("curriculums");

  return (
    <JoinLayout
      step={1}
      aside={<CourseSummary course={courses.selected} loading={courses.loading} nextCohort={nextCohort} onChange={changeCourse} />}
      mobileTop={<CourseChip course={courses.selected} loading={courses.loading} onChange={changeCourse} />}
    >
      <JoinTitle title="Create your account">It takes a minute. Next you'll add your details, choose your weeks and pay.</JoinTitle>
      <Card className="space-y-[18px] p-5 sm:p-8">
        {error ? (
          <Notice
            tone="error"
            action={
              error.includes("Log in") ? (
                <button type="button" onClick={() => onNavigate("student-login")} className={mbtn({ kind: "secondary", size: "sm" })}>
                  Log in
                </button>
              ) : undefined
            }
          >
            {error}
          </Notice>
        ) : null}
        <GoogleButton onClick={google} loading={busy === "google"} disabled={!!busy || !onGoogleAuth} />
        <OrDivider />
        <form onSubmit={submit} noValidate className="space-y-[18px]">
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={emailError}
            disabled={busy === "create"}
          />
          <TextField
            label="Password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            helper={`At least ${MIN_PASSWORD} characters.`}
            error={passwordError}
            disabled={busy === "create"}
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
            {busy === "create" ? (
              <>
                <Spinner /> Creating your account…
              </>
            ) : (
              <>
                Create account <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            By creating an account you agree to the{" "}
            <Link to="/terms" className="underline hover:text-blue-900 dark:hover:text-white">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-blue-900 dark:hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </Card>
      <p className="text-center text-base text-slate-600 dark:text-slate-300 lg:text-left">
        Already have an account?{" "}
        <button type="button" onClick={() => onNavigate("student-login")} className="font-bold text-teal-700 hover:underline dark:text-teal-300">
          Log in
        </button>
      </p>
    </JoinLayout>
  );
};

export default CreateAccountPage;
