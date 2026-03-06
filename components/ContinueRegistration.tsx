// components/ContinueRegistration.tsx ✅ Option A (pathId truth)
// After login only: collect details + create /users/{uid} + go to payment
import React, { useEffect, useMemo, useState } from "react";
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
  selectedPath: string; // supports legacy/pid/cid just like before
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
  msg ? <p className="mt-2 text-[11px] font-bold text-red-600">{msg}</p> : null;

const ContinueRegistration: React.FC<ContinueRegistrationProps> = ({
  onNavigate,
  selectedPath,
}) => {
  // ✅ Auth-safe gating (prevents bounce back to login)
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
    // Only redirect AFTER auth finishes hydrating
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

  // -------------------------
  // Load Paths
  // -------------------------
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

  // -------------------------
  // Load Courses
  // -------------------------
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

  // -------------------------
  // Load cohort for selectedPathId
  // -------------------------
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

      // ✅ clear only on success (prevents being stuck if save fails)
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

  // Optional: tiny loading shell while auth hydrates (prevents flashing)
  if (!authReady) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Loading your account…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Continue Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Confirm your details and course, then proceed to payment.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cohort
            </span>
            <span className="text-xs font-bold text-blue-900 dark:text-teal-400">
              {cohortLoading ? "Loading..." : cohort?.label || "Current Cohort"}
            </span>
          </div>

          {!pathsLoading && pathsError && (
            <div className="mt-6 text-left max-w-xl mx-auto p-4 rounded-2xl border bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200">
              <p className="text-xs font-black uppercase tracking-widest">
                Paths not loading
              </p>
              <p className="mt-2 text-sm font-bold">{pathsError}</p>
            </div>
          )}

          {!coursesLoading && coursesError && (
            <div className="mt-4 text-left max-w-xl mx-auto p-4 rounded-2xl border bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200">
              <p className="text-xs font-black uppercase tracking-widest">
                Courses not loading
              </p>
              <p className="mt-2 text-sm font-bold">{coursesError}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
              <FieldError msg={fieldErrors.fullName} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Phone Number
                </label>
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="08012345678"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Digits only (10–15).
                </p>
                <FieldError msg={fieldErrors.phone} />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Age Range
                </label>
                <select
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  <option value="Under 18">Under 18</option>
                  <option value="18-24">18–24</option>
                  <option value="25-34">25–34</option>
                  <option value="35-44">35–44</option>
                  <option value="45+">45+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Select Path / Course
                </label>

                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCourseId(id);
                    const found = courseOptions.find((c) => c.id === id);
                    if (found) setSelectedPathId(found.pathId);
                  }}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                  disabled={coursesLoading || pathsLoading}
                >
                  {courseOptions.map((c) => {
                    const pTitle =
                      pathsById.get(c.pathId)?.title || c.title || "Path";
                    const suffix = c.source === "firestore" ? "" : " (Pinned)";
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

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-grow">
                  <label className="block text-xs font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest mb-2">
                    Initial Commitment
                  </label>

                  <select
                    name="weeksToCommit"
                    value={formData.weeksToCommit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-blue-900 dark:text-white font-black outline-none"
                  >
                    {weeksOptions.map((w) => (
                      <option key={w} value={String(w)}>
                        {w} {w === 1 ? "Week" : "Weeks"} (₦
                        {(w * weeklyRate).toLocaleString()})
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-[10px] text-slate-400">
                    Max: {maxWeeks} weeks • Selected Path:{" "}
                    <span className="font-black">{selectedPathTitle}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-blue-900/50 dark:text-teal-400/50 uppercase tracking-widest">
                    Total to Pay
                  </p>
                  <p className="text-2xl font-black text-blue-900 dark:text-white">
                    ₦{currentTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <button
              disabled={disableSubmit}
              type="submit"
              className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Proceed to Payment"}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("student-dashboard")}
              className="w-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
            >
              Cancel & Return
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContinueRegistration;
