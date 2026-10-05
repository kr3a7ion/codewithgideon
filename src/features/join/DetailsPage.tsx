import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { View } from "../../app/views";
import { useApp } from "../../app/AppContext";
import { registrationStore } from "../../../services/registrationStore";
import { mbtn } from "../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../marketing/useContactLinks";
import { Card, IconTile, Notice, naira, plural, Spinner } from "../shared/ui";
import { readJoinCourse } from "./joinCourse";
import { BottomBar, JoinLayout } from "./JoinLayout";
import { ChoiceChips, CourseOptions, FormCard, GoogleButton, JoinTitle, OrderSummary, TextField, WeeksPicker } from "./ui";
import { useJoinCourses } from "./useJoinCourses";

type Result = { success: boolean; error?: string };

const AGE_RANGES = [
  { value: "Under 18", label: "Under 18" },
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45+", label: "45+" },
];
const GENDERS = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

type Errors = Partial<Record<"fullName" | "phone" | "ageRange" | "gender", string>>;

const validate = (f: { fullName: string; phone: string; ageRange: string; gender: string }): Errors => {
  const e: Errors = {};
  const name = f.fullName.trim();
  if (!name) e.fullName = "Enter your full name.";
  else if (name.length < 3 || !name.includes(" ")) e.fullName = "Enter your first and last name.";
  const digits = f.phone.replace(/\D/g, "");
  if (!digits) e.phone = "Enter your WhatsApp number.";
  else if (digits.length < 10 || digits.length > 15) e.phone = "Enter a WhatsApp number like 0803 000 0000.";
  if (!f.ageRange) e.ageRange = "Choose your age range.";
  if (!f.gender) e.gender = "Choose an option.";
  return e;
};

const saveMessage = (err: any) => {
  const raw = String(err?.message || err || "").toLowerCase();
  if (raw.includes("network") || raw.includes("offline")) return "We couldn't reach the server. Check your connection and try again.";
  if (raw.includes("signed in") || raw.includes("auth")) return "Your sign-in needs refreshing. Log in again to carry on.";
  if (raw.includes("permission")) return "We couldn't save your details. Refresh the page and try again.";
  return String(err?.message || "") || "We couldn't save your details. Please try again.";
};

/** Join step 2: /student/register. Details, course and weeks. */
const DetailsPage: React.FC<{
  onNavigate: (view: View, data?: unknown) => void;
  selectedPath: string;
  onGoogleAuth?: () => Promise<Result>;
}> = ({ onNavigate, selectedPath, onGoogleAuth }) => {
  const { isLoadingAuth, studentAccount, studentProfile } = useApp();
  const { nextCohortDate } = useContactLinks();
  const nextCohort = upcomingCohortLabel(nextCohortDate);
  const pending = studentProfile && studentProfile.status !== "Complete" ? studentProfile : null;
  const preferred = selectedPath || (pending?.courseId ? `cid:${pending.courseId}` : "") || readJoinCourse();
  const courses = useJoinCourses(preferred);
  const course = courses.selected;

  const [form, setForm] = useState({ fullName: "", phone: "", ageRange: "", gender: "" });
  const [weeks, setWeeks] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState<"payment" | "later" | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const prefilled = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Enrolled students have nothing to fill in here.
  useEffect(() => {
    if (studentProfile?.status === "Complete") onNavigate("student-dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfile?.status]);

  // Coming back before paying: start from what they saved last time.
  useEffect(() => {
    if (prefilled.current || !pending) return;
    prefilled.current = true;
    setForm({
      fullName: String(pending.fullName || ""),
      phone: String(pending.phone || ""),
      ageRange: String(pending.ageRange || ""),
      gender: String(pending.gender || ""),
    });
    if (Number(pending.weeksToCommit) > 0) setWeeks(Number(pending.weeksToCommit));
  }, [pending]);

  const maxWeeks = course?.weeks || 1;
  const safeWeeks = Math.max(1, Math.min(maxWeeks, weeks || Math.min(4, maxWeeks)));
  const total = safeWeeks * (course?.rate || 0);
  const cohortLine = courses.cohort?.label
    ? `${courses.cohort.label}${nextCohort ? ` · starts ${nextCohort}` : ""}`
    : nextCohort
      ? `Next cohort starts ${nextCohort}`
      : "";

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async (destination: "payment" | "later") => {
    setSubmitError("");
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"]`)?.focus();
      return;
    }
    if (!studentAccount) return setSubmitError("Your sign-in needs refreshing. Log in again to carry on.");
    if (!course) return setSubmitError("Choose a course to continue.");
    if (!courses.cohort?.cohortKey) {
      return setSubmitError(
        courses.cohortLoading ? "Still loading the cohort. Try again in a moment." : "Sign-up for this course isn't open yet. Message Gideon on WhatsApp to hear when it opens.",
      );
    }
    setSaving(destination);
    try {
      await registrationStore.completeStudentProfileAfterLogin(studentAccount.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ""),
        ageRange: form.ageRange,
        gender: form.gender,
        weeksToCommit: safeWeeks,
        totalPrice: total,
        path: course.pathTitle,
        pathId: course.pathId,
        courseId: course.courseId,
        courseDurationWeeks: course.weeks,
        weeklyRate: course.rate,
      });
      try {
        localStorage.removeItem("cwg_registration_handoff");
        localStorage.removeItem("cwg_account_created");
      } catch {
        // ignore
      }
      if (destination === "payment") {
        onNavigate("payment", {
          userData: {
            uid: studentAccount.uid,
            email: studentAccount.email,
            fullName: form.fullName.trim(),
            phone: form.phone.replace(/\D/g, ""),
            path: course.pathTitle,
            pathId: course.pathId,
            courseId: course.courseId,
            courseTitle: course.title,
            weeksToCommit: safeWeeks,
            cohortId: courses.cohort.cohortId,
            cohortLabel: courses.cohort.label,
            cohortKey: courses.cohort.cohortKey,
            courseDurationWeeks: course.weeks,
            weeklyRate: course.rate,
          },
          selectedPath: course.pathTitle,
        });
      } else {
        onNavigate("student-dashboard");
      }
    } catch (err) {
      console.error("save registration failed:", err);
      setSubmitError(saveMessage(err));
    } finally {
      setSaving(null);
    }
  };

  // ---- not ready / signed out ----
  if (isLoadingAuth) {
    return (
      <JoinLayout step={2} width="narrow">
        <Card className="flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Spinner className="text-teal-600" /> Loading your account…
        </Card>
      </JoinLayout>
    );
  }

  if (!studentAccount) {
    return (
      <JoinLayout step={2} width="narrow">
        <Card className="space-y-5 p-5 sm:p-8">
          <IconTile icon={ShieldCheck} size="lg" />
          <JoinTitle title="Log in to carry on">Your account is saved. Log in and you'll pick up right here.</JoinTitle>
          {googleError ? <Notice tone="error">{googleError}</Notice> : null}
          <GoogleButton
            loading={googleBusy}
            disabled={!onGoogleAuth}
            onClick={async () => {
              setGoogleError("");
              setGoogleBusy(true);
              try {
                const res = await onGoogleAuth?.();
                if (res && !res.success) setGoogleError(res.error || "Google sign-in didn't finish. Please try again.");
              } finally {
                setGoogleBusy(false);
              }
            }}
          />
          <button type="button" onClick={() => onNavigate("student-login")} className={mbtn({ kind: "secondary", size: "lg", full: true })}>
            Log in with email
          </button>
        </Card>
      </JoinLayout>
    );
  }

  const summary = (
    <OrderSummary courseTitle={course?.title || ""} cohortLine={cohortLine} weeks={safeWeeks} rate={course?.rate || 0} loading={courses.loading} />
  );
  const busy = !!saving || courses.loading;

  return (
    <JoinLayout
      step={2}
      aside={
        <>
          {summary}
          <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400">Your total updates as you change the course or weeks.</p>
        </>
      }
      bottomBar={
        <BottomBar label={`${plural(safeWeeks, "week")} · due today`} amount={naira(total)}>
          <button type="submit" form="join-details" disabled={busy} className={mbtn({ kind: "learn", size: "lg" })}>
            {saving === "payment" ? <Spinner /> : null}
            Continue {saving === "payment" ? null : <ArrowRight className="h-5 w-5" aria-hidden />}
          </button>
        </BottomBar>
      }
    >
      <JoinTitle title="Tell us about you">This sets up your student profile. You can change your name and number later.</JoinTitle>

      <form
        id="join-details"
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save("payment");
        }}
        className="space-y-5 sm:space-y-6"
      >
        {submitError ? <Notice tone="error">{submitError}</Notice> : null}

        <FormCard title="About you" titleId="about-you">
          <div className="space-y-[18px]">
            <div data-field="fullName">
              <TextField
                label="Full name"
                autoComplete="name"
                placeholder="e.g. Amaka Obi"
                value={form.fullName}
                onChange={(e) => set("fullName")(e.target.value)}
                helper="As you'd like it on your certificate."
                error={errors.fullName}
              />
            </div>
            <div data-field="phone">
              <TextField
                label="WhatsApp number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value.replace(/[^\d+\s]/g, ""))}
                helper="Class reminders and mentor replies come here."
                error={errors.phone}
              />
            </div>
            <div data-field="ageRange">
              <ChoiceChips label="Age range" options={AGE_RANGES} value={form.ageRange} onChange={set("ageRange")} error={errors.ageRange} />
            </div>
            <div data-field="gender">
              <ChoiceChips label="Gender" options={GENDERS} value={form.gender} onChange={set("gender")} error={errors.gender} />
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Your course"
          titleId="your-course"
          description={preferred ? "You picked this on the course page. You can switch here." : "Choose the course you want to join."}
        >
          {courses.loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-paper dark:bg-slate-800" />
              ))}
            </div>
          ) : courses.error ? (
            <Notice tone="error">{courses.error}</Notice>
          ) : (
            <CourseOptions label="Your course" options={courses.options} value={course?.id || ""} onChange={courses.selectId} />
          )}
        </FormCard>

        <FormCard title="How many weeks?" titleId="how-many-weeks" description="Start small if you like. You can add weeks from your dashboard any time.">
          {course ? (
            <WeeksPicker value={safeWeeks} max={maxWeeks} onChange={setWeeks} quickPicks={[1, 4, maxWeeks]} />
          ) : (
            <div className="h-14 animate-pulse rounded-[14px] bg-paper dark:bg-slate-800" />
          )}
        </FormCard>

        <div className="lg:hidden">{summary}</div>

        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-5">
          <button type="submit" disabled={busy} className={mbtn({ kind: "learn", size: "lg", className: "hidden w-full sm:w-auto lg:inline-flex" })}>
            {saving === "payment" ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              <>
                Continue to payment <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void save("later")}
            disabled={busy}
            className="text-[15px] font-bold text-blue-900 hover:underline disabled:opacity-60 dark:text-white"
          >
            {saving === "later" ? "Saving…" : "Save and finish later"}
          </button>
        </div>
      </form>
    </JoinLayout>
  );
};

export default DetailsPage;
