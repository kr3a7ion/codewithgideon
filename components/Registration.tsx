import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import {
  registrationStore,
  ActiveCohort,
  CourseDoc,
} from "../services/registrationStore";

interface RegistrationProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  onComplete: (data: any) => void;
}

type FieldKey = "fullName" | "email" | "password" | "phone";
type FieldErrors = Partial<Record<FieldKey, string>>;

type CourseOption = {
  title: string;
  durationWeeks: number;
  weeklyRate: number;
  source: "pinned" | "firestore";
};

const PINNED_COURSES: CourseOption[] = [
  {
    title: "Flutter & Mobile App Development",
    durationWeeks: 12,
    weeklyRate: 10000,
    source: "pinned",
  },
  {
    title: "Web Development & WordPress",
    durationWeeks: 8,
    weeklyRate: 10000,
    source: "pinned",
  },
  {
    title: "AI-Assisted Development",
    durationWeeks: 4,
    weeklyRate: 10000,
    source: "pinned",
  },
];

// Helpers
const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parsePricePerWeek = (label: string, fallback = 10000) => {
  // Accepts: "₦10k/wk", "₦15,000/wk", "10000", "10k"
  const s = String(label || "").toLowerCase();
  const hasK = s.includes("k");
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return hasK ? num * 1000 : num;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const Registration: React.FC<RegistrationProps> = ({
  onNavigate,
  selectedPath,
  onComplete,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    path: selectedPath || "Flutter & Mobile App Development",
    ageRange: "18-24",
    gender: "Male",
    weeksToCommit: "4",
  });

  const [cohort, setCohort] = useState<ActiveCohort | null>(null);
  const [cohortLoading, setCohortLoading] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ✅ NEW: Course catalog loaded (Firestore + pinned)
  const [courseOptions, setCourseOptions] =
    useState<CourseOption[]>(PINNED_COURSES);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // ---- Load cohort ----
  useEffect(() => {
    let mounted = true;

    const loadCohort = async () => {
      setCohortLoading(true);
      try {
        const active = await registrationStore.getActiveCohort();
        if (mounted) setCohort(active);
      } catch (e) {
        if (mounted) setCohort({ id: "CWG-DEFAULT", label: "Current Cohort" });
      } finally {
        if (mounted) setCohortLoading(false);
      }
    };

    loadCohort();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Load courses ----
  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c) => c.isActive !== false);

        // avoid duplicates with pinned by title
        const pinnedSet = new Set(
          PINNED_COURSES.map((p) => p.title.trim().toLowerCase()),
        );

        const firestoreOptions: CourseOption[] = active
          .filter(
            (c) =>
              !pinnedSet.has(
                String(c.title || "")
                  .trim()
                  .toLowerCase(),
              ),
          )
          .map((c) => ({
            title: c.title,
            durationWeeks: parseWeeksFromDuration(c.duration, 4),
            weeklyRate: parsePricePerWeek(c.priceLabel || "₦10k/wk", 10000),
            source: "firestore",
          }));

        const merged = [...PINNED_COURSES, ...firestoreOptions];

        if (mounted) setCourseOptions(merged);
      } catch (e) {
        console.error("Failed to load courses:", e);
        if (mounted) setCourseOptions(PINNED_COURSES);
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    };

    loadCourses();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Find selected course config (max weeks + weekly rate)
  const selectedCourse = useMemo(() => {
    const key = String(formData.path || "")
      .trim()
      .toLowerCase();
    return (
      courseOptions.find((c) => c.title.trim().toLowerCase() === key) ||
        // fallback: keep app stable even if title not found
        {
          title: formData.path || "Course",
          durationWeeks: 4,
          weeklyRate: 10000,
          source: "pinned" as const,
        }
    );
  }, [courseOptions, formData.path]);

  const maxWeeks = selectedCourse.durationWeeks || 4;
  const weeklyRate = selectedCourse.weeklyRate || 10000;

  // ✅ Clamp weeksToCommit anytime course/path changes
  useEffect(() => {
    const current = parseInt(formData.weeksToCommit || "1", 10) || 1;
    const safe = clamp(current, 1, maxWeeks);
    if (String(safe) !== String(current)) {
      setFormData((p) => ({ ...p, weeksToCommit: String(safe) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxWeeks, formData.path]);

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
    cohortLoading ||
    !cohort?.id ||
    !cohort?.label ||
    coursesLoading;

  const Spinner = ({ size = 18 }: { size?: number }) => (
    <span
      className="inline-block rounded-full border-2 border-white/40 border-t-white animate-spin"
      style={{ width: size, height: size }}
    />
  );

  const InlineSpinner = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-3">
      <span className="h-4 w-4 rounded-full border-2 border-blue-900/30 dark:border-teal-400/30 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      <span className="text-sm font-bold">{label}</span>
    </span>
  );

  // ✅ Validation
  const validateField = (name: FieldKey, value: string): string => {
    const v = (value ?? "").trim();

    if (name === "fullName") {
      if (!v) return "Full name is required.";
      if (v.length < 3)
        return "Please enter your full name (at least 3 characters).";
      if (!v.includes(" ")) return "Please enter both first and last name.";
      return "";
    }

    if (name === "email") {
      if (!v) return "Email is required.";
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) return "Please enter a valid email address.";
      return "";
    }

    if (name === "password") {
      if (!value) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
      return "";
    }

    if (name === "phone") {
      if (!v) return "Phone number is required.";
      const digits = v.replace(/\D/g, "");
      if (digits.length < 10) return "Phone number is too short.";
      if (digits.length > 15) return "Phone number is too long.";
      if (!/^\d+$/.test(digits))
        return "Phone number must contain only digits.";
      return "";
    }

    return "";
  };

  const validateAll = (): FieldErrors => {
    const next: FieldErrors = {};
    (["fullName", "email", "password", "phone"] as FieldKey[]).forEach((k) => {
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

    // ✅ clamp weeks instantly (so UI never shows invalid values)
    if (name === "weeksToCommit") {
      const w = clamp(parseInt(value || "1", 10) || 1, 1, maxWeeks);
      setFormData((p) => ({ ...p, weeksToCommit: String(w) }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));

    if (name === "fullName" || name === "email" || name === "password") {
      const key = name as FieldKey;
      setOneFieldError(key, validateField(key, value));
    }
  };

  const handleBlur = (name: FieldKey) => {
    const msg = validateField(name, (formData as any)[name] || "");
    setOneFieldError(name, msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nextErrors = validateAll();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      if (cohortLoading || !cohort?.id || !cohort?.label) {
        throw new Error(
          "Cohort is still loading. Please try again in a moment.",
        );
      }

      const weeks = clamp(
        parseInt(formData.weeksToCommit || "1", 10) || 1,
        1,
        maxWeeks,
      );

      const { password, ...rest } = formData;

      const data = {
        ...rest,
        phone: String(rest.phone || ""),
        weeksToCommit: weeks,
        totalPrice: weeks * weeklyRate, // ✅ per-course rate
        cohortId: cohort.id,
        cohortLabel: cohort.label,

        // ✅ optional but useful later
        courseDurationWeeks: maxWeeks,
        weeklyRate,
      };

      const uid = await registrationStore.createAccount(data as any, password);
      onComplete({ ...data, uid });
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-2 text-xs font-bold text-red-600">{msg}</p> : null;

  // ✅ build weeks options based on course duration
  const weeksOptions = useMemo(() => {
    const arr = [];
    for (let w = 1; w <= maxWeeks; w++) arr.push(w);
    return arr;
  }, [maxWeeks]);

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Create Your Account
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Join the cohort and start your professional journey.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cohort
            </span>
            <span className="text-xs font-bold text-blue-900 dark:text-teal-400">
              {cohortLoading ? "Loading..." : cohort?.label || "Current Cohort"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
          {isSubmitting && (
            <div className="absolute inset-0 z-10 rounded-[2.5rem] bg-white/70 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
              <div className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                <InlineSpinner label="Creating your account…" />
              </div>
            </div>
          )}

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
                onBlur={() => handleBlur("fullName")}
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
              <FieldErrorText msg={fieldErrors.fullName} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <FieldErrorText msg={fieldErrors.email} />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <FieldErrorText msg={fieldErrors.password} />
              </div>
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
                  onBlur={() => handleBlur("phone")}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="08012345678"
                  minLength={10}
                  maxLength={15}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Digits only (10–15). Example: 08012345678
                </p>
                <FieldErrorText msg={fieldErrors.phone} />
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

              {/* ✅ UPDATED: Select Path now includes Firestore courses too */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Select Path
                </label>
                <select
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  {courseOptions.map((c) => (
                    <option key={`${c.source}-${c.title}`} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>

                {coursesLoading && (
                  <p className="mt-2 text-[10px] text-slate-400">
                    Loading available courses…
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-grow">
                  <label className="block text-xs font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest mb-2">
                    Initial Commitment
                  </label>

                  {/* ✅ UPDATED: weeks options capped by course duration */}
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
                    Max: {maxWeeks} weeks for this course.
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
              className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 transform active:scale-95 flex items-center justify-center gap-3"
            >
              {cohortLoading || coursesLoading ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Loading…
                </>
              ) : isSubmitting ? (
                <>
                  <Spinner />
                  Processing Registration...
                </>
              ) : (
                "Secure Your Seat"
              )}
            </button>

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 px-6">
              By clicking "Secure Your Seat", you agree to our Terms of Service.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="w-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
