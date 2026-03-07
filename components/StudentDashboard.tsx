import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Users,
  CalendarDays,
  Clock3,
  BookOpen,
  Video,
  PlayCircle,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Lock,
  Phone,
  BadgeCheck,
  Sparkles,
  Layers3,
  TimerReset,
} from "lucide-react";
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

const toMs = (v: any): number | null => {
  if (!v) return null;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "object" && typeof v.seconds === "number") {
    return v.seconds * 1000;
  }
  return null;
};

const parsePricePerWeek = (label: string, fallback = 10000) => {
  const s = String(label || "").toLowerCase();
  const hasK = s.includes("k");
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return hasK ? num * 1000 : num;
};

type SessionTag = "LIVE" | "RECORDING SOON" | "JOIN LINK AVAILABLE";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

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
  const [showAllClassesModal, setShowAllClassesModal] = useState(false);

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
          await registrationStore.updateStudentEnrollmentFields(profile.uid, {
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

  const isEnrolled = profile?.status === "Complete";

  const paidWeeks = Math.max(0, Number(profile?.weeksToCommit || 0));
  const totalProgramWeeks = Math.max(1, Number(courseMaxWeeks || 1));

  const progressPercent = clamp((paidWeeks / totalProgramWeeks) * 100, 0, 100);
  const hasAnyPending =
    profile?.status === "Pending" ||
    profile?.pendingPayment?.status === "Pending";

  const hasPendingTopUp =
    profile?.pendingPayment?.status === "Pending" &&
    profile?.pendingPayment?.kind === "topup";

  const remainingWeeks = Math.max(0, totalProgramWeeks - paidWeeks);
  const canTopUp =
    isEnrolled &&
    remainingWeeks > 0 &&
    !(profile?.pendingPayment?.status === "Pending");

  const joinedDate = new Date(
    profile?.timestamp || Date.now(),
  ).toLocaleDateString();

  const liveSession = useMemo(() => {
    if (hasAnyPending) return null;

    const nowMs = Date.now();

    const live = (sessions || [])
      .map((s) => {
        const startMs = toMs((s as any).startsAt);
        const endMs =
          toMs((s as any).endsAt) ??
          (startMs != null
            ? startMs + Number((s as any).durationMins || 60) * 60 * 1000
            : null);

        return {
          ...s,
          _startMs: startMs ?? NaN,
          _endMs: endMs ?? NaN,
        };
      })
      .filter((s) => Number.isFinite(s._startMs) && Number.isFinite(s._endMs))
      .find(
        (s) => (s._startMs as number) <= nowMs && nowMs <= (s._endMs as number),
      );

    return live || null;
  }, [sessions, hasAnyPending]);

  const nextSession = useMemo(() => {
    if (hasAnyPending) return null;

    const nowMs = Date.now();

    const upcoming = (sessions || [])
      .map((s) => ({ ...s, _ms: toMs((s as any).startsAt) ?? NaN }))
      .filter((s) => Number.isFinite(s._ms))
      .filter((s) => (s._ms as number) > nowMs)
      .sort((a, b) => (a._ms as number) - (b._ms as number));

    return upcoming[0] || null;
  }, [sessions, hasAnyPending]);

  const latestUnlockedSession = useMemo(() => {
    if (hasAnyPending) return null;

    const ordered = (sessions || [])
      .map((s) => ({ ...s, _ms: toMs((s as any).startsAt) ?? NaN }))
      .filter((s) => Number.isFinite(s._ms))
      .sort((a, b) => (b._ms as number) - (a._ms as number));

    return ordered[0] || null;
  }, [sessions, hasAnyPending]);

  const heroSession =
    liveSession || nextSession || latestUnlockedSession || null;

  const heroLabel = liveSession
    ? "Live Now"
    : nextSession
      ? "Next Live Session"
      : latestUnlockedSession
        ? "Latest Unlocked Class"
        : "Class Status";

  const primaryJoinUrl = liveSession?.joinUrl || nextSession?.joinUrl || "";
  const hasJoinableSession = !!primaryJoinUrl;

  const formatSessionTime = (s: SessionDoc) => {
    const ms = toMs((s as any).startsAt);
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

  const unlockedWeeks = hasAnyPending ? 0 : paidWeeks;
  const unlockedSessions = useMemo(
    () => (sessions || []).filter((s: any) => Number(s.week) <= unlockedWeeks),
    [sessions, unlockedWeeks],
  );

  const formatNaira = (n: number) => `₦${Math.max(0, n).toLocaleString()}`;

  const sessionsNavPayload = {
    cohortId,
    cohortLabel,
    cohortKey,
    path: profile?.path,
    pathId: profile?.pathId,
  };

  const goToSessions = () => setShowAllClassesModal(true);

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

  const TagRow = ({ tags }: { tags: SessionTag[] }) => {
    if (!tags || tags.length === 0) {
      return (
        <div className="mt-3 flex flex-wrap gap-2">
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
      <div className="mt-3 flex flex-wrap gap-2">
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Profile missing
          </h1>
          <p className="text-sm text-slate-500 mb-6">Please log in again.</p>

          <button
            onClick={onLogout}
            className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-4 rounded-2xl inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-10 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {/* Header */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-10 gap-6"
          >
            <div className="flex items-center gap-4 min-w-0">
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white dark:border-slate-800 shrink-0"
              >
                {profile.fullName.charAt(0)}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-teal-500" />
                </div>
              </motion.div>

              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-black text-blue-900 dark:text-white truncate">
                  Welcome, {profile.fullName.split(" ")[0]}!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                  {profile.email}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-teal-500" />
                    {cohortLoading ? <CohortSkeleton /> : cohortLabel}
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    <Layers3 className="w-3.5 h-3.5 text-blue-500" />
                    {courseLoading ? (
                      <InlineSpinner label="Loading plan…" />
                    ) : (
                      <>
                        {totalProgramWeeks} weeks • ₦
                        {weeklyRate.toLocaleString()}/wk
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="self-start md:self-auto px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 md:mb-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Progress
                </p>
                <BadgeCheck className="w-4 h-4 text-teal-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {Math.round(progressPercent)}%
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {paidWeeks} of {totalProgramWeeks} weeks paid
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Remaining
                </p>
                <TimerReset className="w-4 h-4 text-orange-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {remainingWeeks}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                week{remainingWeeks === 1 ? "" : "s"} left
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Sessions
                </p>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {hasAnyPending ? 0 : unlockedSessions.length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                unlocked classes
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Status
                </p>
                {hasAnyPending ? (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                )}
              </div>
              <p className="mt-3 text-lg font-black text-blue-900 dark:text-white">
                {hasAnyPending ? "Pending" : "Active"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {hasPendingTopUp ? "top-up pending" : "subscription state"}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Enrollment */}
              <motion.div
                variants={fadeUp}
                className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-100/50 dark:bg-teal-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-orange-100/30 dark:bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      <BookOpen className="w-3.5 h-3.5" />
                      Current Enrollment
                    </p>

                    <h2 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white mb-6 md:mb-8">
                      {profile.path}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      profile.status === "Complete"
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-200"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200"
                    }`}
                  >
                    {profile.status === "Complete" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock3 className="w-3.5 h-3.5" />
                    )}
                    {profile.status === "Complete"
                      ? hasPendingTopUp
                        ? "Top-up Pending"
                        : "Subscription Active"
                      : "Payment Pending"}
                  </span>
                </div>

                <div className="space-y-6 relative">
                  <div className="flex justify-between items-end gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Weekly Access Paid
                      </p>
                      <p className="text-xl md:text-2xl font-black text-blue-900 dark:text-teal-400">
                        {paidWeeks} / {totalProgramWeeks} Weeks
                      </p>
                    </div>
                    <p className="text-sm font-bold text-blue-900 dark:text-white">
                      {Math.round(progressPercent)}%
                    </p>
                  </div>

                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="mt-8 md:mt-12 p-5 md:p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative border border-blue-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <h4 className="font-bold text-blue-900 dark:text-white inline-flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500 dark:text-teal-400" />
                      {hasAnyPending
                        ? "Finish your payment"
                        : canTopUp
                          ? "Ready for more?"
                          : "You’re fully paid"}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {hasAnyPending
                        ? "You have an incomplete payment. Continue to checkout to complete it before starting a new top-up."
                        : canTopUp
                          ? "Add more weeks to your subscription to stay in the live cohort."
                          : "You’ve reached the maximum weeks for this course."}
                    </p>
                  </div>

                  {hasAnyPending ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinuePayment}
                      className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : canTopUp ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsTopUpOpen(true)}
                      className="px-8 py-4 bg-blue-900 dark:bg-teal-600 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                      Pay Remaining {remainingWeeks === 1 ? "Week" : "Weeks"} (
                      {remainingWeeks})
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="px-6 py-3 rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 font-black text-sm whitespace-nowrap inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Fully Paid
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Live Class / Unlocked Sessions */}
              <motion.div
                variants={fadeUp}
                className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-100/40 dark:bg-teal-500/10 blur-2xl" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-orange-100/30 dark:bg-blue-500/10 blur-2xl" />

                <div className="relative">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <p className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                          <Video className="w-3.5 h-3.5" />
                          {heroLabel}
                        </p>

                        {!sessionsLoading &&
                          !hasAnyPending &&
                          sessions.length > 0 && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Layers3 className="w-3.5 h-3.5" />
                              {sessions.length} Class
                              {sessions.length > 1 ? "es" : ""} Unlocked
                            </span>
                          )}

                        {liveSession && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-300 border border-red-100 dark:border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>

                      {sessionsLoading ? (
                        <div className="text-slate-500 dark:text-slate-300">
                          <InlineSpinner label="Loading sessions…" />
                        </div>
                      ) : hasAnyPending ? (
                        <>
                          <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white">
                            Sessions are locked
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                            Complete your payment to unlock your class schedule,
                            class notes, and live session access.
                          </p>
                        </>
                      ) : heroSession ? (
                        <>
                          <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white leading-tight">
                            Week {heroSession.week}: {heroSession.title}
                          </h3>

                          <TagRow tags={getSessionTags(heroSession)} />

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                            <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 px-4 py-3">
                              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Schedule
                              </p>
                              <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                {formatSessionTime(heroSession)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 px-4 py-3">
                              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <BookOpen className="w-3.5 h-3.5" />
                                Track
                              </p>
                              <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                {heroSession.path}
                              </p>
                            </div>
                          </div>

                          {!!heroSession.notes && (
                            <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800 max-w-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                Class Detail
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {heroSession.notes}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl font-black text-blue-900 dark:text-white">
                            No classes published yet
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                            Your cohort is active, but no class has been
                            published yet. Once sessions are scheduled, they
                            will appear here automatically.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[220px]">
                      {hasAnyPending ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleContinuePayment}
                          className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-lg transition inline-flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Continue to Payment
                        </motion.button>
                      ) : sessions.length > 0 ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={goToSessions}
                            className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition bg-blue-900 dark:bg-teal-600 text-white shadow-lg hover:opacity-95 inline-flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            View All Classes
                          </motion.button>

                          {hasJoinableSession ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openJoin(primaryJoinUrl)}
                              className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition bg-teal-600 text-white hover:bg-teal-500 shadow-lg inline-flex items-center justify-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              {liveSession
                                ? "Join Live Class"
                                : "Open Next Class"}
                            </motion.button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-8" id="unlocked-sessions">
                    {sessionsLoading ? null : hasAnyPending ? (
                      <div className="p-6 rounded-3xl bg-orange-50/60 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10">
                        <div className="font-black text-blue-900 dark:text-white text-lg inline-flex items-center gap-2">
                          <Lock className="w-5 h-5 text-orange-500" />
                          Sessions are locked
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                          Your payment is pending. Once it’s completed, your
                          unlocked sessions will appear here and you’ll be able
                          to join live classes.
                        </p>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-6 rounded-3xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          No unlocked sessions yet. Once sessions are published
                          for your cohort, they’ll show here.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Quick Preview
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {Math.min(5, sessions.length)} of{" "}
                            {sessions.length}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <AnimatePresence initial={false}>
                            {sessions.slice(0, 5).map((s, index) => (
                              <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.04 }}
                                className="group p-5 rounded-[1.75rem] bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 hover:shadow-lg transition"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base font-black text-blue-900 dark:text-white">
                                      Week {s.week}: {s.title}
                                    </p>

                                    <TagRow tags={getSessionTags(s)} />

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <Clock3 className="w-3.5 h-3.5" />
                                          Time
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {formatSessionTime(s)}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <BookOpen className="w-3.5 h-3.5" />
                                          Track
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {s.path}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <Video className="w-3.5 h-3.5" />
                                          Access
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {s.joinUrl
                                            ? "Join available"
                                            : "Link coming soon"}
                                        </p>
                                      </div>
                                    </div>

                                    {!!s.notes && (
                                      <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-900/40 border border-blue-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                          Class Detail
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {s.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {s.joinUrl ? (
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[170px]">
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openJoin(s.joinUrl)}
                                        className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-900 dark:bg-teal-600 text-white hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                                      >
                                        <PlayCircle className="w-3.5 h-3.5" />
                                        Join Class
                                      </motion.button>
                                    </div>
                                  ) : null}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {sessions.length > 5 && (
                          <div className="mt-5 flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={goToSessions}
                              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-white hover:opacity-90 transition inline-flex items-center gap-2"
                            >
                              See Remaining {sessions.length - 5} Classes
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              variants={fadeUp}
              className="space-y-6 md:space-y-8 lg:sticky lg:top-6"
            >
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-blue-900 dark:text-white mb-6 uppercase tracking-widest inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-500" />
                  Your Plan
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                    <span className="text-slate-400 inline-flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Joined
                    </span>
                    <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                      {joinedDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                    <span className="text-slate-400 inline-flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </span>
                    <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                      {profile.phone}
                    </span>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-start gap-4 text-sm">
                    <span className="text-slate-400 pt-0.5 inline-flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Cohort
                    </span>
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

                  {remainingWeeks > 0 && !hasAnyPending && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="mt-6 rounded-2xl border p-4 bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-slate-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
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
                    </motion.div>
                  )}

                  {profile.pendingPayment?.status === "Pending" && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="mt-6 rounded-2xl border p-4 bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
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
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        <AnimatePresence>
          {showAllClassesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.985 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-6xl h-[88vh] rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
              >
                <div className="relative border-b border-gray-100 dark:border-slate-800 px-5 md:px-7 py-5 md:py-6 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                  <div className="absolute -top-12 right-10 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                        <BookOpen className="w-3.5 h-3.5" />
                        Available Classes
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white tracking-tight">
                        Your Unlocked Classes
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {sessions.length} class{sessions.length > 1 ? "es" : ""}{" "}
                        available in your learning path.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAllClassesModal(false)}
                      className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                      aria-label="Close classes modal"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="h-[calc(88vh-112px)] overflow-auto px-5 md:px-7 py-5 md:py-6 bg-slate-50/70 dark:bg-slate-950/60">
                  {sessions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="max-w-md text-center">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-5">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <h4 className="text-xl font-black text-blue-900 dark:text-white mb-2">
                          No classes available yet
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                          Once sessions are published for your cohort, they’ll
                          appear here automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                      <AnimatePresence initial={false}>
                        {sessions.map((s, index) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="group rounded-[1.75rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-lg shrink-0">
                                    W{s.week}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-lg font-black text-blue-900 dark:text-white leading-tight">
                                      {s.title}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                      Week {s.week}
                                    </p>
                                  </div>
                                </div>

                                <TagRow tags={getSessionTags(s)} />
                              </div>

                              {s.joinUrl ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => openJoin(s.joinUrl)}
                                  className="shrink-0 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-900 dark:bg-teal-600 text-white hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  Join
                                </motion.button>
                              ) : null}
                            </div>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-3">
                                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  Schedule
                                </p>
                                <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                  {formatSessionTime(s)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-3">
                                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Track
                                </p>
                                <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                  {s.path}
                                </p>
                              </div>
                            </div>

                            {!!s.notes && (
                              <div className="mt-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  Class Detail
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {s.notes}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Up Modal */}
        <AnimatePresence>
          {isTopUpOpen && canTopUp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-teal-500/10 text-blue-900 dark:text-teal-300 flex items-center justify-center mb-5">
                  <CreditCard className="w-6 h-6" />
                </div>

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
                    <span className="text-2xl font-black text-teal-600 inline-flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />₦
                      {(selectedWeeksClamped * weeklyRate).toLocaleString()}
                    </span>
                  </div>

                  {remainingWeeks > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                      Remaining:{" "}
                      <span className="font-bold">{remainingWeeks}</span>{" "}
                      week(s)
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsTopUpOpen(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTopUp}
                    className="flex-1 py-4 bg-blue-900 dark:bg-teal-600 text-white font-bold rounded-2xl shadow-lg inline-flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentDashboard;
