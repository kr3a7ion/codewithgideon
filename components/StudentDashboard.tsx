// components/StudentDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import {
  registrationStore,
  RegistrationEntry,
  SessionDoc,
  CourseDoc,
} from "../services/registrationStore";

interface StudentDashboardProps {
  onNavigate: (view: View, extraData?: unknown) => void;
  onLogout: () => void;
  profile: RegistrationEntry | null;
}

const PINNED = [
  { title: "Flutter & Mobile App Development", weeks: 12, rate: 10000 },
  { title: "Web Development & WordPress", weeks: 8, rate: 10000 },
  { title: "AI-Assisted Development", weeks: 4, rate: 10000 },
];

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parsePricePerWeek = (label: string, fallback = 10000) => {
  const s = String(label || "").toLowerCase();
  const hasK = s.includes("k");
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return hasK ? num * 1000 : num;
};

type SessionTag = "LIVE" | "RECORDING SOON" | "JOIN LINK AVAILABLE";

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onLogout,
  profile,
}) => {
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [courseLoading, setCourseLoading] = useState(true);
  const [courseMaxWeeks, setCourseMaxWeeks] = useState<number>(4);
  const [weeklyRate, setWeeklyRate] = useState<number>(10000);

  const [cohortLoading, setCohortLoading] = useState(true);
  const [activeForPath, setActiveForPath] = useState<{
    cohortId: string;
    cohortKey: string;
    label: string;
  } | null>(null);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpWeeks, setTopUpWeeks] = useState("1");

  // -----------------------------
  // ✅ Load active cohort for student's path
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadCohortForPath = async () => {
      if (!profile?.uid || !profile?.path) return;

      setCohortLoading(true);
      try {
        const safePath = profile.path;
        const inferredPathId =
          profile.pathId || (await registrationStore.resolvePathId(safePath));

        const active = inferredPathId
          ? await registrationStore.getActiveCohortForPathId(inferredPathId)
          : await registrationStore.getActiveCohortForPath(safePath);

        if (!mounted) return;

        setActiveForPath({
          cohortId: active.cohortId,
          cohortKey: active.cohortKey,
          label: active.label,
        });

        try {
          await registrationStore.updateUserCohortFields(profile.uid, {
            cohortId: active.cohortId,
            cohortLabel: active.label,
            cohortKey: active.cohortKey,
          });
        } catch {
          // ignore
        }
      } catch {
        if (!mounted) return;
        setActiveForPath(null);
      } finally {
        if (!mounted) return;
        setCohortLoading(false);
      }
    };

    loadCohortForPath();
    return () => {
      mounted = false;
    };
  }, [profile?.uid, profile?.path, profile?.pathId]);

  const cohortId =
    profile?.cohortId || activeForPath?.cohortId || "CWG-DEFAULT";
  const cohortKey =
    profile?.cohortKey || activeForPath?.cohortKey || "CWG-DEFAULT";
  const cohortLabel =
    profile?.cohortLabel || activeForPath?.label || "Current Cohort";

  // -----------------------------
  // ✅ Load course pricing + max weeks
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadCourse = async () => {
      if (!profile?.path) return;

      setCourseLoading(true);

      const pinned = PINNED.find(
        (p) =>
          p.title.trim().toLowerCase() === profile.path.trim().toLowerCase(),
      );
      if (pinned) {
        if (!mounted) return;
        setCourseMaxWeeks(pinned.weeks);
        setWeeklyRate(pinned.rate);
        setCourseLoading(false);
        return;
      }

      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c: any) => c.isActive !== false);

        const found = active.find((c: any) => {
          if (profile.courseId)
            return String(c.id) === String(profile.courseId);
          if (profile.pathId && c.pathId)
            return String(c.pathId) === String(profile.pathId);

          return (
            String(c.title || "")
              .trim()
              .toLowerCase() ===
            String(profile.path || "")
              .trim()
              .toLowerCase()
          );
        });

        if (!mounted) return;

        if (found) {
          const w = Number((found as any).weeks);
          const p = Number((found as any).pricePerWeek);

          const weeks =
            Number.isFinite(w) && w > 0
              ? Math.floor(w)
              : parseWeeksFromDuration((found as any).duration || "4", 4);

          const rate =
            Number.isFinite(p) && p > 0
              ? Math.floor(p)
              : parsePricePerWeek(
                  (found as any).priceLabel || "₦10k/wk",
                  10000,
                );

          setCourseMaxWeeks(weeks);
          setWeeklyRate(rate);
        } else {
          if (profile.courseDurationWeeks)
            setCourseMaxWeeks(profile.courseDurationWeeks);
          if (profile.weeklyRate) setWeeklyRate(profile.weeklyRate);
        }
      } catch {
        if (!mounted) return;
        if (profile.courseDurationWeeks)
          setCourseMaxWeeks(profile.courseDurationWeeks);
        if (profile.weeklyRate) setWeeklyRate(profile.weeklyRate);
      } finally {
        if (!mounted) return;
        setCourseLoading(false);
      }
    };

    loadCourse();
    return () => {
      mounted = false;
    };
  }, [
    profile?.path,
    profile?.pathId,
    profile?.courseId,
    profile?.courseDurationWeeks,
    profile?.weeklyRate,
  ]);

  // -----------------------------
  // ✅ Load unlocked sessions available to student
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadSessions = async () => {
      if (!profile?.uid) return;

      setSessionsLoading(true);
      try {
        const unlocked =
          await registrationStore.getUnlockedSessionsForStudent(profile);

        if (!mounted) return;
        setSessions(unlocked || []);
      } catch {
        if (!mounted) return;
        setSessions([]);
      } finally {
        if (!mounted) return;
        setSessionsLoading(false);
      }
    };

    loadSessions();
    return () => {
      mounted = false;
    };
  }, [
    profile?.uid,
    profile?.pathId,
    profile?.path,
    profile?.cohortKey,
    profile?.cohortId,
    profile?.weeksToCommit,
  ]);

  // -----------------------------
  // ✅ Enrollment + progress + pending logic
  // -----------------------------
  const isEnrolled = profile?.status === "Complete";

  const paidWeeks = Math.max(0, Number(profile?.weeksToCommit || 0));
  const totalProgramWeeks = Math.max(1, Number(courseMaxWeeks || 1));

  const progressPercent = clamp((paidWeeks / totalProgramWeeks) * 100, 0, 100);

  const hasAnyPending = profile?.pendingPayment?.status === "Pending";
  const hasPendingTopUp =
    hasAnyPending && profile?.pendingPayment?.kind === "topup";

  const remainingWeeks = Math.max(0, totalProgramWeeks - paidWeeks);
  const canTopUp = isEnrolled && remainingWeeks > 0 && !hasAnyPending;

  const joinedDate = new Date(
    profile?.timestamp || Date.now(),
  ).toLocaleDateString();

  // -----------------------------
  // Next session + formatting
  // -----------------------------
  const nextSession = useMemo(() => {
    const nowMs = Date.now();

    const upcoming = (sessions || [])
      .map((s) => ({
        ...s,
        _ms:
          typeof (s as any)?.startsAt?.toMillis === "function"
            ? (s as any).startsAt.toMillis()
            : NaN,
      }))
      .filter((s) => Number.isFinite(s._ms))
      .filter((s) => (s._ms as number) >= nowMs)
      .sort((a, b) => (a._ms as number) - (b._ms as number));

    return upcoming[0] || null;
  }, [sessions]);

  const formatSessionTime = (s: SessionDoc) => {
    const ms =
      typeof (s as any)?.startsAt?.toMillis === "function"
        ? (s as any).startsAt.toMillis()
        : null;
    if (!ms) return "TBD";

    const d = new Date(ms);
    return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const openJoin = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // -----------------------------
  // ✅ NEW: money + sessions routing + session tags
  // -----------------------------
  const formatNaira = (n: number) => `₦${Math.max(0, n).toLocaleString()}`;

  const sessionsNavPayload = {
    cohortId,
    cohortLabel,
    cohortKey,
    path: profile?.path,
    pathId: profile?.pathId,
  };

  const goToSessions = () => onNavigate("sessions" as View, sessionsNavPayload);

  const getSessionWindowMs = (s: SessionDoc) => {
    const startMs =
      typeof (s as any)?.startsAt?.toMillis === "function"
        ? (s as any).startsAt.toMillis()
        : NaN;

    const endMsRaw =
      typeof (s as any)?.endsAt?.toMillis === "function"
        ? (s as any).endsAt.toMillis()
        : NaN;

    const durationMs =
      Number.isFinite(Number((s as any).durationMins)) &&
      Number((s as any).durationMins) > 0
        ? Number((s as any).durationMins) * 60 * 1000
        : 60 * 60 * 1000;

    const endMs = Number.isFinite(endMsRaw) ? endMsRaw : startMs + durationMs;

    return { startMs, endMs };
  };

  const getSessionTags = (s: SessionDoc): SessionTag[] => {
    const now = Date.now();
    const { startMs, endMs } = getSessionWindowMs(s);

    const isLive =
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      now >= startMs &&
      now <= endMs;

    const joinAvailable = !!String((s as any).joinUrl || "").trim();

    // Recording Soon = ended recently (48h) AND join link not available yet
    const endedRecently =
      Number.isFinite(endMs) &&
      now > endMs &&
      now - endMs <= 48 * 60 * 60 * 1000;

    const recordingSoon = endedRecently && !joinAvailable;

    const tags: SessionTag[] = [];
    if (isLive) tags.push("LIVE");
    if (joinAvailable) tags.push("JOIN LINK AVAILABLE");
    if (recordingSoon) tags.push("RECORDING SOON");
    return tags;
  };

  const tagClass = (kind: SessionTag) => {
    if (kind === "LIVE") {
      return "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 border border-teal-100 dark:border-teal-500/20";
    }
    if (kind === "JOIN LINK AVAILABLE") {
      return "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 border border-blue-100 dark:border-blue-500/20";
    }
    return "bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200 border border-orange-100 dark:border-orange-500/20";
  };

  // ✅ IMPORTANT FIX: render tags inline so TS never tries to treat `key` as a prop
  const TagRow = ({ tags }: { tags: SessionTag[] }) => {
    if (!tags || tags.length === 0) {
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tagClass(
              "RECORDING SOON",
            )}`}
          >
            RECORDING SOON
          </span>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tagClass(
              t,
            )}`}
          >
            {t}
          </span>
        ))}
      </div>
    );
  };

  // -----------------------------
  // UI bits
  // -----------------------------
  const InlineSpinner = ({ label }: { label?: string }) => (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/70 dark:border-slate-600 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      {label ? <span className="font-bold">{label}</span> : null}
    </span>
  );

  const CohortSkeleton = () => (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/70 dark:border-slate-600 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      <span className="inline-block h-3 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </span>
  );

  const selectedWeeksClamped = Math.min(
    Math.max(1, parseInt(topUpWeeks || "1", 10) || 1),
    Math.max(1, remainingWeeks || 1),
  );

  const buildPaymentPayload = () => {
    if (!profile) return null;

    const base = {
      uid: profile.uid,
      email: profile.email,
      path: profile.path,
      pathId: profile.pathId,
      courseId: profile.courseId,

      cohortId,
      cohortLabel,
      cohortKey,

      courseDurationWeeks: totalProgramWeeks,
      weeklyRate,
    };

    if (profile.pendingPayment?.status === "Pending") {
      const pp = profile.pendingPayment;
      return {
        selectedPath: profile.path,
        userData: {
          ...base,
          weeksToCommit: Number(pp.weeks) || 1,
          originalWeeks: paidWeeks,
          isTopUp: pp.kind === "topup",
          reference: pp.reference,
        },
      };
    }

    return {
      selectedPath: profile.path,
      userData: {
        ...base,
        weeksToCommit: Math.max(1, paidWeeks || 1),
        isTopUp: false,
      },
    };
  };

  const handleContinuePayment = () => {
    const payload = buildPaymentPayload();
    if (!(payload as any)?.userData?.uid || !(payload as any)?.userData?.email)
      return;
    onNavigate("payment", payload);
  };

  const handleTopUp = () => {
    if (!profile) return;
    if (!canTopUp) {
      setIsTopUpOpen(false);
      return;
    }

    const requested = Math.max(1, parseInt(topUpWeeks || "1", 10) || 1);
    const weeks = Math.min(requested, remainingWeeks || 1);

    onNavigate("payment", {
      selectedPath: profile.path,
      userData: {
        uid: profile.uid,
        email: profile.email,
        path: profile.path,
        pathId: profile.pathId,
        courseId: profile.courseId,

        weeksToCommit: weeks,
        originalWeeks: paidWeeks,
        isTopUp: true,

        cohortId,
        cohortLabel,
        cohortKey,

        courseDurationWeeks: totalProgramWeeks,
        weeklyRate,
      },
    });

    setIsTopUpOpen(false);
  };

  if (!profile) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Profile missing
          </h1>
          <p className="text-sm text-slate-500 mb-6">Please log in again.</p>

          <button
            onClick={onLogout}
            className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white dark:border-slate-800">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 dark:text-white">
                Welcome, {profile.fullName.split(" ")[0]}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {profile.email}
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Cohort:{" "}
                <span className="font-bold">
                  {cohortLoading ? <CohortSkeleton /> : cohortLabel}
                </span>{" "}
                {!cohortLoading && cohortId !== "CWG-DEFAULT" && (
                  <span className="font-mono">({cohortId})</span>
                )}
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Plan:{" "}
                <span className="font-bold">
                  {courseLoading ? (
                    <InlineSpinner label="Loading course…" />
                  ) : (
                    <>
                      {totalProgramWeeks} weeks • ₦{weeklyRate.toLocaleString()}
                      /wk
                    </>
                  )}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enrollment */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <span
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    profile.status === "Complete"
                      ? "bg-teal-50 text-teal-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {profile.status === "Complete"
                    ? hasPendingTopUp
                      ? "Top-up Pending"
                      : "Subscription Active"
                    : "Payment Pending"}
                </span>
              </div>

              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Current Enrollment
              </p>
              <h2 className="text-3xl font-black text-blue-900 dark:text-white mb-8">
                {profile.path}
              </h2>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Weekly Access Paid
                    </p>
                    <p className="text-2xl font-black text-blue-900 dark:text-teal-400">
                      {paidWeeks} / {totalProgramWeeks} Weeks
                    </p>
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-white">
                    {Math.round(progressPercent)}%
                  </p>
                </div>

                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-white">
                    {hasAnyPending
                      ? "Finish your payment"
                      : canTopUp
                        ? "Ready for more?"
                        : "You’re fully paid"}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hasAnyPending
                      ? "You have an incomplete payment. Continue to checkout to complete it before starting a new top-up."
                      : canTopUp
                        ? "Add more weeks to your subscription to stay in the live cohort."
                        : "You’ve reached the maximum weeks for this course."}
                  </p>
                </div>

                {hasAnyPending ? (
                  <button
                    onClick={handleContinuePayment}
                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap hover:scale-105"
                  >
                    Continue to Payment
                  </button>
                ) : canTopUp ? (
                  <button
                    onClick={() => setIsTopUpOpen(true)}
                    className="px-8 py-4 bg-blue-900 dark:bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    Pay Remaining {remainingWeeks === 1 ? "Week" : "Weeks"} (
                    {remainingWeeks})
                  </button>
                ) : (
                  <div className="px-6 py-3 rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 font-black text-sm whitespace-nowrap">
                    Fully Paid ✅
                  </div>
                )}
              </div>
            </div>

            {/* Next Live Session */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Next Live Session
                  </p>

                  {sessionsLoading ? (
                    <div className="text-slate-500 dark:text-slate-300">
                      <InlineSpinner label="Loading sessions…" />
                    </div>
                  ) : nextSession ? (
                    <>
                      <h3 className="text-xl font-black text-blue-900 dark:text-white">
                        Week {nextSession.week}: {nextSession.title}
                      </h3>

                      {/* ✅ Tags (fixed key typing issue) */}
                      <TagRow tags={getSessionTags(nextSession)} />

                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {formatSessionTime(nextSession)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 font-bold">
                        {nextSession.path}
                      </p>
                    </>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400">
                      No upcoming sessions found yet.
                    </div>
                  )}
                </div>

                {/* Continue Learning always routes to sessions */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={goToSessions}
                    className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition bg-blue-900 dark:bg-teal-600 text-white shadow-lg hover:opacity-95"
                  >
                    Continue Learning
                  </button>

                  <button
                    disabled={!nextSession?.joinUrl}
                    onClick={() => openJoin(nextSession?.joinUrl)}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition ${
                      nextSession?.joinUrl
                        ? "bg-teal-600 text-white hover:bg-teal-500 shadow-lg"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Join Live Class
                  </button>

                  <button
                    onClick={goToSessions}
                    className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-teal-400 hover:underline"
                  >
                    View all sessions
                  </button>
                </div>
              </div>

              {/* Unlocked list (preview) */}
              <div className="mt-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Unlocked Sessions (Paid Weeks)
                </p>

                {sessionsLoading ? (
                  <div className="text-slate-500 dark:text-slate-300">
                    <InlineSpinner label="Loading…" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No unlocked sessions yet. Once sessions are published for
                    your cohort and you’ve paid at least 1 week, they’ll show
                    here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            Week {s.week}: {s.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {formatSessionTime(s)}
                          </p>

                          {/* Tags */}
                          <TagRow tags={getSessionTags(s)} />
                        </div>

                        <button
                          disabled={!s.joinUrl}
                          onClick={() => openJoin(s.joinUrl)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                            s.joinUrl
                              ? "bg-blue-900 dark:bg-teal-600 text-white hover:opacity-90"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-blue-900 dark:text-white mb-6 uppercase tracking-widest">
                Your Plan
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                  <span className="text-slate-400">Joined</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                    {joinedDate}
                  </span>
                </div>

                <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                    {profile.phone}
                  </span>
                </div>

                <div className="grid grid-cols-[90px_1fr] items-start gap-4 text-sm">
                  <span className="text-slate-400 pt-0.5">Cohort</span>
                  <div className="text-right">
                    <div className="font-bold text-blue-900 dark:text-slate-200 leading-tight">
                      {cohortLoading ? (
                        <span className="inline-flex items-center justify-end gap-2">
                          <InlineSpinner label="Loading cohort…" />
                        </span>
                      ) : (
                        cohortLabel
                      )}
                    </div>
                    {!cohortLoading && cohortId !== "CWG-DEFAULT" && (
                      <div className="mt-1 text-[11px] font-mono text-slate-400">
                        {cohortId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next payment due */}
                {remainingWeeks > 0 && !hasAnyPending && (
                  <div className="mt-6 rounded-2xl border p-4 bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest">
                        Next payment due
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/70 dark:bg-slate-800/60">
                        {remainingWeeks} wk{remainingWeeks === 1 ? "" : "s"}{" "}
                        left
                      </span>
                    </div>

                    <p className="text-sm font-bold mt-3">
                      {formatNaira(remainingWeeks * weeklyRate)} •{" "}
                      {remainingWeeks} week(s)
                    </p>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      Top up anytime to keep access active.
                    </p>
                  </div>
                )}

                {profile.pendingPayment?.status === "Pending" && (
                  <div className="mt-6 rounded-2xl border p-4 bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest">
                        Pending Payment
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
                        {profile.pendingPayment.kind === "topup"
                          ? "Top-up"
                          : "Initial"}
                      </span>
                    </div>

                    <p className="text-sm font-bold mt-3">
                      {profile.pendingPayment.weeks} week(s) • ₦
                      {Number(profile.pendingPayment.amount).toLocaleString()}
                    </p>

                    <p className="mt-2 text-[11px] font-mono opacity-90 break-all">
                      {profile.pendingPayment.reference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Up Modal */}
        {isTopUpOpen && canTopUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">
                Extend Your Access
              </h3>

              <div className="space-y-4 mb-8">
                <select
                  value={topUpWeeks}
                  onChange={(e) => setTopUpWeeks(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
                    .filter((w) => w <= remainingWeeks)
                    .map((w) => (
                      <option key={w} value={String(w)}>
                        {w} {w === 1 ? "Week" : "Weeks"} (₦
                        {(w * weeklyRate).toLocaleString()})
                      </option>
                    ))}
                </select>

                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Total Due
                  </span>
                  <span className="text-2xl font-black text-teal-600">
                    ₦{(selectedWeeksClamped * weeklyRate).toLocaleString()}
                  </span>
                </div>

                {remainingWeeks > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                    Remaining:{" "}
                    <span className="font-bold">{remainingWeeks}</span> week(s)
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsTopUpOpen(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  className="flex-1 py-4 bg-blue-900 dark:bg-teal-600 text-white font-bold rounded-2xl shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
