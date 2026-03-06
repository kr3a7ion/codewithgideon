// components/ContinueRegistration.tsx
// ✅ Option A (pathId truth)
// After login only: collect details + create /users/{uid} + go to payment
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  UserRound,
  Phone,
  CalendarRange,
  Users,
  BookOpen,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { View } from "../src/App";
import {
  registrationStore,
  CourseDoc,
  ActiveCohortForPath,
  PathDoc,
} from "../services/registrationStore";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

type FieldKey = "fullName" | "phone";
type FieldErrors = Partial<Record<FieldKey, string>>;

type CourseOption = {
  id: string;
  title: string;
  durationWeeks: number;
  weeklyRate: number;
  pathId: string;
  courseId?: string;
  source: "pinned" | "firestore";
};

interface ContinueRegistrationProps {
  onNavigate: (view: View, extraData?: any) => void;
  selectedPath: string;
}

const PINNED_COURSES_RAW: Omit<CourseOption, "pathId">[] = [
  {
    id: "flutter",
    title: "Flutter & Mobile App Development",
    durationWeeks: 12,
    weeklyRate: 10000,
    source: "pinned",
  },
  {
    id: "wordpress",
    title: "Web Development & WordPress",
    durationWeeks: 8,
    weeklyRate: 10000,
    source: "pinned",
  },
  {
    id: "ai",
    title: "AI-Assisted Development",
    durationWeeks: 4,
    weeklyRate: 10000,
    source: "pinned",
  },
];

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

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const parseSelectedPathInput = (selectedPath: string) => {
  const raw = String(selectedPath || "").trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith("pid:"))
    return { kind: "pathId" as const, value: raw.slice(4).trim() };
  if (lower.startsWith("cid:"))
    return { kind: "courseId" as const, value: raw.slice(4).trim() };
  return { kind: "title" as const, value: raw };
};

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
      {msg}
    </p>
  ) : null;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const ContinueRegistration: React.FC<ContinueRegistrationProps> = ({
  onNavigate,
  selectedPath,
}) => {
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthReady(true);
      setUid(u?.uid || "");
      setEmail(u?.email || "");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authReady && !uid) onNavigate("student-login");
  }, [authReady, uid, onNavigate]);

  const [selectedPathId, setSelectedPathId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    ageRange: "18-24",
    gender: "Male",
    weeksToCommit: "4",
  });

  const [paths, setPaths] = useState<PathDoc[]>([]);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [pathsError, setPathsError] = useState("");

  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  const [cohort, setCohort] = useState<ActiveCohortForPath | null>(null);
  const [cohortLoading, setCohortLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const activePaths = useMemo(
    () => (paths || []).filter((p) => (p as any)?.isActive !== false),
    [paths],
  );

  const pathsByTitle = useMemo(() => {
    const m = new Map<string, PathDoc>();
    activePaths.forEach((p) =>
      m.set(
        String(p.title || "")
          .trim()
          .toLowerCase(),
        p,
      ),
    );
    return m;
  }, [activePaths]);

  const pathsById = useMemo(() => {
    const m = new Map<string, PathDoc>();
    activePaths.forEach((p) => m.set(p.id, p));
    return m;
  }, [activePaths]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setPathsLoading(true);
      setPathsError("");
      try {
        const list = await registrationStore.getPaths(true);
        if (!mounted) return;
        setPaths(list || []);
      } catch (e: any) {
        if (!mounted) return;
        setPaths([]);
        setPathsError(
          e?.message ||
            "Failed to load paths. Check Firestore read rules for /paths.",
        );
      } finally {
        if (mounted) setPathsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (pathsLoading) return;
    let mounted = true;

    (async () => {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const list: CourseDoc[] = await registrationStore.getCourses();

        const active = (list || []).filter(
          (c: any) =>
            c.isActive !== false &&
            (c as any).showOnLanding !== false &&
            String((c as any).pathId || "").trim().length > 0,
        );

        const firestoreOptions: CourseOption[] = active.map((c: any) => ({
          id: c.id,
          courseId: c.id,
          pathId: String(c.pathId),
          title: String(c.title || "Course"),
          durationWeeks:
            Number(c.weeks) > 0
              ? Number(c.weeks)
              : parseWeeksFromDuration(c.duration, 4),
          weeklyRate:
            Number(c.pricePerWeek) > 0
              ? Number(c.pricePerWeek)
              : parsePricePerWeek(c.priceLabel || "₦10k/wk", 10000),
          source: "firestore",
        }));

        const pinnedOptions: CourseOption[] = PINNED_COURSES_RAW.map((p) => {
          const match = pathsByTitle.get(p.title.trim().toLowerCase());
          return match ? ({ ...p, pathId: match.id } as CourseOption) : null;
        }).filter(Boolean) as CourseOption[];

        const key = (o: CourseOption) =>
          `${o.pathId}::${o.title.trim().toLowerCase()}`;
        const seen = new Set<string>();
        const merged: CourseOption[] = [];
        [...pinnedOptions, ...firestoreOptions].forEach((o) => {
          const k = key(o);
          if (seen.has(k)) return;
          seen.add(k);
          merged.push(o);
        });

        if (!mounted) return;
        setCourseOptions(merged);

        const parsed = parseSelectedPathInput(selectedPath);
        const pick = (opt: CourseOption) => {
          setSelectedCourseId(opt.id);
          setSelectedPathId(opt.pathId);
        };

        if (parsed.kind === "courseId") {
          const hit = merged.find(
            (c) => c.courseId === parsed.value || c.id === parsed.value,
          );
          if (hit) return pick(hit);
        }

        if (parsed.kind === "pathId") {
          const hit = merged.find((c) => c.pathId === parsed.value);
          if (hit) return pick(hit);
          if (pathsById.has(parsed.value)) setSelectedPathId(parsed.value);
        }

        if (parsed.kind === "title") {
          const desired = parsed.value.trim().toLowerCase();
          const desiredPath = desired ? pathsByTitle.get(desired) : null;
          const firstForPath = desiredPath
            ? merged.find((c) => c.pathId === desiredPath.id)
            : null;
          if (firstForPath) return pick(firstForPath);
        }

        if (merged[0]) pick(merged[0]);
      } catch (e: any) {
        if (!mounted) return;
        setCoursesError(
          e?.message ||
            "Failed to load courses. Check Firestore read rules for /courses.",
        );

        const pinnedOptions: CourseOption[] = PINNED_COURSES_RAW.map((p) => {
          const match = pathsByTitle.get(p.title.trim().toLowerCase());
          return match ? ({ ...p, pathId: match.id } as CourseOption) : null;
        }).filter(Boolean) as CourseOption[];

        setCourseOptions(pinnedOptions);
        if (pinnedOptions[0]) {
          setSelectedCourseId(pinnedOptions[0].id);
          setSelectedPathId(pinnedOptions[0].pathId);
        }
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedPath, pathsLoading, pathsByTitle, pathsById]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!selectedPathId) {
        setCohort(null);
        setCohortLoading(false);
        return;
      }
      setCohortLoading(true);
      try {
        const active =
          await registrationStore.getActiveCohortForPathId(selectedPathId);
        if (mounted) setCohort(active);
      } catch {
        if (mounted) setCohort(null);
      } finally {
        if (mounted) setCohortLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedPathId]);

  const selectedCourse = useMemo(() => {
    const byId = courseOptions.find((c) => c.id === selectedCourseId);
    if (byId) return byId;
    const firstForPath = selectedPathId
      ? courseOptions.find((c) => c.pathId === selectedPathId)
      : null;
    return (
      firstForPath ||
      courseOptions[0] || {
        id: "fallback",
        title: "Course",
        durationWeeks: 4,
        weeklyRate: 10000,
        pathId: selectedPathId || "",
        source: "pinned" as const,
      }
    );
  }, [courseOptions, selectedCourseId, selectedPathId]);

  const maxWeeks = selectedCourse.durationWeeks || 4;
  const weeklyRate = selectedCourse.weeklyRate || 10000;

  useEffect(() => {
    const current = parseInt(formData.weeksToCommit || "1", 10) || 1;
    const safe = clamp(current, 1, maxWeeks);
    if (String(safe) !== String(current))
      setFormData((p) => ({ ...p, weeksToCommit: String(safe) }));
  }, [maxWeeks]); // eslint-disable-line

  const currentTotal = useMemo(() => {
    const weeks = clamp(
      parseInt(formData.weeksToCommit || "1", 10) || 1,
      1,
      maxWeeks,
    );
    return weeks * weeklyRate;
  }, [formData.weeksToCommit, weeklyRate, maxWeeks]);

  const disableSubmit =
    isSubmitting ||
    coursesLoading ||
    pathsLoading ||
    cohortLoading ||
    !authReady ||
    !uid ||
    !email ||
    !selectedPathId ||
    !cohort?.cohortKey;

  const validateField = (name: FieldKey, value: string): string => {
    const v = (value ?? "").trim();
    if (name === "fullName") {
      if (!v) return "Full name is required.";
      if (v.length < 3)
        return "Please enter your full name (at least 3 characters).";
      if (!v.includes(" ")) return "Please enter both first and last name.";
      return "";
    }
    if (name === "phone") {
      if (!v) return "Phone number is required.";
      const digits = v.replace(/\D/g, "");
      if (digits.length < 10) return "Phone number is too short.";
      if (digits.length > 15) return "Phone number is too long.";
      return "";
    }
    return "";
  };

  const validateAll = (): FieldErrors => {
    const next: FieldErrors = {};
    (["fullName", "phone"] as FieldKey[]).forEach((k) => {
      const msg = validateField(k, (formData as any)[k] || "");
      if (msg) next[k] = msg;
    });
    return next;
  };

  const setOneFieldError = (name: FieldKey, message: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/[^\d]/g, "");
      setFormData((p) => ({ ...p, phone: digitsOnly }));
      setOneFieldError("phone", validateField("phone", digitsOnly));
      return;
    }

    if (name === "weeksToCommit") {
      const w = clamp(parseInt(value || "1", 10) || 1, 1, maxWeeks);
      setFormData((p) => ({ ...p, weeksToCommit: String(w) }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
    if (name === "fullName")
      setOneFieldError("fullName", validateField("fullName", value));
  };

  const selectedPathTitle =
    (selectedPathId ? pathsById.get(selectedPathId)?.title : "") ||
    selectedCourse.title ||
    "Path";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nextErrors = validateAll();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!authReady) return setError("Auth is still initializing. Try again.");
    if (!uid || !email)
      return setError("Auth session missing. Please login again.");
    if (!selectedPathId) return setError("Please select a Path.");
    if (cohortLoading || !cohort?.cohortKey)
      return setError("Cohort is still loading. Please try again.");

    setIsSubmitting(true);
    try {
      const weeks = clamp(
        parseInt(formData.weeksToCommit || "1", 10) || 1,
        1,
        maxWeeks,
      );

      await registrationStore.completeStudentProfileAfterLogin(uid, {
        fullName: formData.fullName,
        phone: formData.phone,
        ageRange: formData.ageRange,
        gender: formData.gender,
        weeksToCommit: weeks,
        totalPrice: weeks * weeklyRate,
        path: selectedPathTitle,
        pathId: selectedPathId,
        courseId: selectedCourse.courseId || undefined,
      });

      localStorage.removeItem("cwg_registration_handoff");
      localStorage.removeItem("cwg_account_created");

      onNavigate("payment", {
        userData: {
          uid,
          email,
          path: selectedPathTitle,
          pathId: selectedPathId,
          courseId: selectedCourse.courseId || null,
          weeksToCommit: weeks,
          cohortId: cohort.cohortId,
          cohortLabel: cohort.label,
          cohortKey: cohort.cohortKey,
          courseDurationWeeks: maxWeeks,
          weeklyRate,
        },
        selectedPath: selectedPathTitle,
      });
    } catch (err: any) {
      setError(
        err?.message || "Could not save registration. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const weeksOptions = useMemo(
    () => Array.from({ length: maxWeeks }, (_, i) => i + 1),
    [maxWeeks],
  );

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl text-center"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5">
            <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Loading your account…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      <div className="relative">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
          {/* Left Side / Intro */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="lg:sticky lg:top-8"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles size={14} />
                <span>Final step before payment</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
                Continue
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                  Registration.
                </span>
              </h1>

              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                Confirm your personal details, choose the right learning path,
                and continue securely to payment.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm">
                <UserRound className="w-5 h-5 text-blue-500 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Account
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white break-all">
                  {email || "Signed in"}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm">
                <Users className="w-5 h-5 text-teal-500 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Cohort
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {cohortLoading
                    ? "Loading..."
                    : cohort?.label || "Current Cohort"}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-orange-500 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Checkout
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Secure flow
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 space-y-4">
              {!pathsLoading && pathsError && (
                <div className="p-4 rounded-2xl border bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200">
                  <p className="text-xs font-black uppercase tracking-widest">
                    Paths not loading
                  </p>
                  <p className="mt-2 text-sm font-bold">{pathsError}</p>
                </div>
              )}

              {!coursesLoading && coursesError && (
                <div className="p-4 rounded-2xl border bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200">
                  <p className="text-xs font-black uppercase tracking-widest">
                    Courses not loading
                  </p>
                  <p className="mt-2 text-sm font-bold">{coursesError}</p>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Side / Form */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 lg:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="continue-registration-error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-relaxed">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserRound className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <FieldError msg={fieldErrors.fullName} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="08012345678"
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 ml-1">
                    Digits only (10–15).
                  </p>
                  <FieldError msg={fieldErrors.phone} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Age Range
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarRange className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      name="ageRange"
                      value={formData.ageRange}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Under 18">Under 18</option>
                      <option value="18-24">18–24</option>
                      <option value="25-34">25–34</option>
                      <option value="35-44">35–44</option>
                      <option value="45+">45+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Gender
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Select Path / Course
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedCourseId(id);
                        const found = courseOptions.find((c) => c.id === id);
                        if (found) setSelectedPathId(found.pathId);
                      }}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                      disabled={coursesLoading || pathsLoading}
                    >
                      {courseOptions.map((c) => {
                        const pTitle =
                          pathsById.get(c.pathId)?.title || c.title || "Path";
                        const suffix =
                          c.source === "firestore" ? "" : " (Pinned)";
                        return (
                          <option key={`${c.source}-${c.id}`} value={c.id}>
                            {pTitle} — {c.title}
                            {suffix}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-5 md:p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-grow">
                    <label className="text-sm font-bold text-blue-900 dark:text-teal-300 ml-1 block mb-2">
                      Initial Commitment
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-blue-500 dark:text-teal-400" />
                      </div>
                      <select
                        name="weeksToCommit"
                        value={formData.weeksToCommit}
                        onChange={handleChange}
                        className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {weeksOptions.map((w) => (
                          <option key={w} value={String(w)}>
                            {w} {w === 1 ? "Week" : "Weeks"} (₦
                            {(w * weeklyRate).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                      Max: {maxWeeks} weeks • Selected Path:{" "}
                      <span className="font-black text-slate-700 dark:text-slate-200">
                        {selectedPathTitle}
                      </span>
                    </p>
                  </div>

                  <div className="md:text-right shrink-0">
                    <p className="text-[10px] font-black text-blue-900/50 dark:text-teal-400/50 uppercase tracking-widest">
                      Total to Pay
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                      ₦{currentTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: disableSubmit ? 1 : 1.01 }}
                  whileTap={{ scale: disableSubmit ? 1 : 0.98 }}
                  disabled={disableSubmit}
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving... Please wait</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => onNavigate("student-dashboard")}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel & Return
                </button>
              </div>

              <div className="pt-2 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Your details are saved before payment continues</span>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContinueRegistration;
