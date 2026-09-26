import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "../src/App";
import { registrationStore, CourseDoc } from "../services/registrationStore";
import { usePaystackPayment } from "react-paystack";
import { auth } from "../services/firebase";

interface UserData {
  uid: string;
  email: string;

  // legacy label (keep)
  path: string;

  // ✅ new fields
  pathId?: string;
  courseId?: string;

  weeksToCommit: number | string;
  reference?: string;
  originalWeeks?: number;
  isTopUp?: boolean;

  cohortId?: string;
  cohortLabel?: string;

  // ✅ NEW: best doc id for /cohorts/{cohortKey}
  cohortKey?: string;

  // optional (if dashboard passed it)
  courseDurationWeeks?: number;
  weeklyRate?: number;
}

type PaymentIncoming =
  | UserData
  | { selectedPath?: string; userData?: UserData }
  | null
  | undefined;

interface PaymentProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  userData: PaymentIncoming;
  onPaymentSuccess?: (newTotalWeeks: number) => void;
}

const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parsePricePerWeek = (label: string, fallback = 0) => {
  const s = String(label || "").toLowerCase();
  const hasK = s.includes("k");
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return hasK ? num * 1000 : num;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const Badge = ({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "teal" | "orange" | "slate";
  children: React.ReactNode;
}) => {
  const cls =
    tone === "teal"
      ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 border-teal-100 dark:border-teal-500/20"
      : tone === "orange"
        ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200 border-orange-100 dark:border-orange-500/20"
        : tone === "slate"
          ? "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 border-slate-200 dark:border-slate-700"
          : "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-teal-200 border-blue-100 dark:border-blue-800/40";

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}
    >
      {children}
    </span>
  );
};

const Payment: React.FC<PaymentProps> = ({
  onNavigate,
  selectedPath,
  userData,
  onPaymentSuccess,
}) => {
  const FUNCTION_URL = import.meta.env.VITE_VERIFY_PAYSTACK_URL as string;
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

  const normalized = useMemo(() => {
    const anyData = userData as any;

    if (anyData?.userData?.uid) {
      return {
        selectedPath: anyData.selectedPath || selectedPath,
        userData: anyData.userData as UserData,
      };
    }

    if (anyData?.uid) {
      return {
        selectedPath,
        userData: anyData as UserData,
      };
    }

    return { selectedPath, userData: null as any };
  }, [userData, selectedPath]);

  const safePath = normalized.selectedPath || selectedPath;
  const u = normalized.userData as UserData | null;
  const authUid = auth.currentUser?.uid || "";

  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "verifying" | "success" | "failed"
  >("idle");

  const [errorMsg, setErrorMsg] = useState<string>("");

  // ✅ per-path cohort fallback (NOT /config/app global)
  const [fallbackCohort, setFallbackCohort] = useState<{
    cohortId: string;
    cohortLabel: string;
    cohortKey: string;
  } | null>(null);

  // ✅ course config in Payment too
  const [courseMaxWeeks, setCourseMaxWeeks] = useState<number>(
    u?.courseDurationWeeks || 0,
  );
  const [courseWeeklyRate, setCourseWeeklyRate] = useState<number>(
    u?.weeklyRate || 0,
  );
  const [courseConfigLoading, setCourseConfigLoading] = useState(
    !(u?.courseDurationWeeks && u?.weeklyRate),
  );
  const [courseConfigError, setCourseConfigError] = useState("");

  // prevent double init
  const inFlightRef = useRef(false);

  // -----------------------------
  // ✅ Load per-path cohort if missing (pathId preferred)
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadCohortForPath = async () => {
      if (!u?.uid) return;
      if (u.cohortId && u.cohortLabel && u.cohortKey) return;

      try {
        const inferredPathId =
          u.pathId || (await registrationStore.resolvePathId(safePath));

        const active = inferredPathId
          ? await registrationStore.getActiveCohortForPathId(inferredPathId)
          : await registrationStore.getActiveCohortForPath(safePath);

        if (!mounted) return;

        setFallbackCohort({
          cohortId: active.cohortId,
          cohortLabel: active.label,
          cohortKey: active.cohortKey,
        });
      } catch (err) {
        console.warn("loadCohortForPath failed:", err);
        if (!mounted) return;
        setFallbackCohort({
          cohortId: "CWG-DEFAULT",
          cohortLabel: "Current Cohort",
          cohortKey: "CWG-DEFAULT",
        });
      }
    };

    loadCohortForPath();
    return () => {
      mounted = false;
    };
  }, [u?.cohortId, u?.cohortLabel, u?.cohortKey, u?.pathId, safePath]);

  const cohortLabel =
    u.cohortLabel || fallbackCohort?.cohortLabel || "Current Cohort";
  const cohortId = u.cohortId || fallbackCohort?.cohortId || "CWG-DEFAULT";
  const cohortKey = u.cohortKey || fallbackCohort?.cohortKey || "CWG-DEFAULT";

  // -----------------------------
  // ✅ Load course config (truth fields first: weeks + pricePerWeek)
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadCourseConfig = async () => {
      setCourseConfigError("");
      if (!u?.uid) {
        setCourseConfigLoading(false);
        return;
      }

      if (u.courseDurationWeeks && u.weeklyRate) {
        if (!mounted) return;
        setCourseMaxWeeks(Number(u.courseDurationWeeks));
        setCourseWeeklyRate(Number(u.weeklyRate));
        setCourseConfigLoading(false);
        return;
      }

      setCourseConfigLoading(true);
      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter(
          (c) => (c as any).isActive !== false,
        );

        const found = active.find((c: any) => {
          if (u.courseId) return String(c.id) === String(u.courseId);
          if (u.pathId && c.pathId)
            return String(c.pathId) === String(u.pathId);

          return (
            String(c.title || "")
              .trim()
              .toLowerCase() === String(safePath).trim().toLowerCase()
          );
        });

        if (!mounted) return;

        if (found) {
          const w = Number((found as any).weeks);
          const p = Number((found as any).pricePerWeek);

          const weeks =
            Number.isFinite(w) && w > 0
              ? Math.floor(w)
              : parseWeeksFromDuration(found.duration, 4);

          const rate =
            Number.isFinite(p) && p > 0
              ? Math.floor(p)
              : parsePricePerWeek(found.priceLabel || "", 0);

          if (rate > 0 && weeks > 0) {
            setCourseMaxWeeks(weeks);
            setCourseWeeklyRate(rate);
          } else {
            setCourseConfigError(
              "Course pricing is not available right now. Please contact support before paying.",
            );
          }
        } else {
          setCourseConfigError(
            "We could not match this payment to an active course. Please contact support before paying.",
          );
        }
      } catch (e) {
        console.error("Failed to load course config:", e);
        if (!mounted) return;
        setCourseConfigError(
          "We could not sync current course pricing. Please refresh or contact support.",
        );
      } finally {
        if (mounted) setCourseConfigLoading(false);
      }
    };

    loadCourseConfig();
    return () => {
      mounted = false;
    };
  }, [safePath, u.courseDurationWeeks, u.weeklyRate, u.courseId, u.pathId]);

  // ✅ Weeks requested
  const requestedWeeks = useMemo(() => {
    const w =
      typeof u.weeksToCommit === "string"
        ? parseInt(u.weeksToCommit, 10)
        : u.weeksToCommit;
    return Number.isFinite(w) && w > 0 ? w : 1;
  }, [u.weeksToCommit]);

  const originalWeeks = u.originalWeeks ?? 0;

  // ✅ correct cap logic
  const maxAllowedWeeks = useMemo(() => {
    if (!u.isTopUp) return Math.max(0, courseMaxWeeks);
    const remaining = Math.max(0, courseMaxWeeks - originalWeeks);
    return remaining;
  }, [u.isTopUp, courseMaxWeeks, originalWeeks]);

  const topUpWeeks = useMemo(() => {
    if (maxAllowedWeeks <= 0) return 0;
    return clamp(requestedWeeks, 1, maxAllowedWeeks);
  }, [requestedWeeks, maxAllowedWeeks]);

  // -----------------------------
  // PRICE CALCULATION
  // -----------------------------

  const weeklyRate = courseWeeklyRate;

  const basePrice = weeklyRate * topUpWeeks;
  const totalPrice = basePrice;

  // Paystack pass-fees is handled from the Paystack dashboard, so the app only
  // sends the base course amount. Gateway fees may be added at checkout.
  const totalPriceKobo = totalPrice * 100;
  const basePriceKobo = basePrice * 100;

  const newTotalWeeks = u.isTopUp ? originalWeeks + topUpWeeks : topUpWeeks;

  // ✅ stable reference
  const referenceRef = useRef(
    u.reference ||
      `CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(
        Math.random() * 1000,
      )}`,
  );
  const reference = referenceRef.current;

  // ✅ Paystack metadata (shows on Paystack transaction + helps debugging)
  const paystackMetadata = useMemo(
    () => ({
      custom_fields: [
        {
          display_name: "Product",
          variable_name: "product",
          value: "CodeWithGideon",
        },
        { display_name: "UID", variable_name: "uid", value: u.uid },
        {
          display_name: "Kind",
          variable_name: "kind",
          value: u.isTopUp ? "topup" : "initial",
        },
        {
          display_name: "Weeks",
          variable_name: "weeks",
          value: String(topUpWeeks),
        },
        { display_name: "Path", variable_name: "path", value: safePath },
        {
          display_name: "PathId",
          variable_name: "pathId",
          value: String(u.pathId || ""),
        },
        {
          display_name: "CourseId",
          variable_name: "courseId",
          value: String(u.courseId || ""),
        },
        {
          display_name: "CohortKey",
          variable_name: "cohortKey",
          value: String(cohortKey || ""),
        },
      ],
      uid: u.uid,
      kind: u.isTopUp ? "topup" : "initial",
      weeks: topUpWeeks,
      path: safePath,
      pathId: u.pathId || null,
      courseId: u.courseId || null,
      cohortId,
      cohortLabel,
      cohortKey,
      expectedAmountKobo: totalPriceKobo,
      baseAmountKobo: basePriceKobo,
      app: "codewithgideon-web",
      ts: Date.now(),
    }),
    [
      u.uid,
      u.isTopUp,
      topUpWeeks,
      safePath,
      u.pathId,
      u.courseId,
      cohortId,
      cohortLabel,
      cohortKey,
      totalPriceKobo,
    ],
  );

  // ✅ IMPORTANT: include metadata in initializePayment config
  const initializePayment = usePaystackPayment({
    reference,
    email: u.email,
    amount: totalPriceKobo,
    publicKey,
    metadata: paystackMetadata as any,
    channels: [
      "card",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
      "bank_transfer",
    ] as any,
  });

  const disablePay =
    paymentState === "processing" ||
    paymentState === "verifying" ||
    courseConfigLoading ||
    !!courseConfigError ||
    courseMaxWeeks <= 0 ||
    courseWeeklyRate <= 0 ||
    totalPrice <= 0 ||
    topUpWeeks <= 0 ||
    !publicKey ||
    !FUNCTION_URL ||
    !u?.uid ||
    !authUid ||
    authUid !== u.uid ||
    (u.isTopUp && maxAllowedWeeks <= 0);

  const verifyAndFinalize = async (paystackRef: string) => {
    try {
      if (!FUNCTION_URL) throw new Error("Missing VITE_VERIFY_PAYSTACK_URL");
      if (!publicKey) throw new Error("Missing VITE_PAYSTACK_PUBLIC_KEY");

      setPaymentState("verifying");
      setErrorMsg("");

      // Prevent duplicate verification
      const alreadyVerified = sessionStorage.getItem(`pay_${paystackRef}`);

      if (alreadyVerified) {
        console.warn("Duplicate verification prevented");
        return;
      }

      sessionStorage.setItem(`pay_${paystackRef}`, "1");

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paystackRef,
          uid: u.uid,
          expectedAmount: totalPriceKobo,
          weeks: topUpWeeks,
          kind: u.isTopUp ? "topup" : "initial",

          // ✅ cohort (IMPORTANT)
          cohortId,
          cohortLabel,
          cohortKey,

          // ✅ path metadata
          path: safePath,
          pathId: u.pathId,
          courseId: u.courseId,

          // helpful metadata
          courseMaxWeeks,
          weeklyRate,
        }),
      });

      const raw = await resp.text();

      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error("Payment verification returned non-JSON:", {
          status: resp.status,
          body: raw.slice(0, 250),
          reference: paystackRef,
        });
        throw new Error(
          "Payment verification is temporarily unavailable. Please try again.",
        );
      }

      if (!resp.ok || !json?.ok) {
        const detail = json?.details
          ? ` | details: ${JSON.stringify(json.details)}`
          : "";
        throw new Error(
          (json?.error || `Verify failed (${resp.status})`) + detail,
        );
      }

      setPaymentState("success");
      onPaymentSuccess?.(newTotalWeeks);
      localStorage.removeItem("cwg_registration_handoff"); // ✅ important
    } catch (err: any) {
      console.error("Verification failed:", err);
      setPaymentState("failed");
      setErrorMsg(
        "We could not confirm this payment yet. Please retry, or contact support with your payment reference.",
      );
    } finally {
      inFlightRef.current = false;
    }
  };

  const friendlyPaymentStartError = (err: any) => {
    const raw = String(err?.message || err || "").trim();
    const lower = raw.toLowerCase();

    if (
      lower.includes("vite_") ||
      lower.includes("public_key") ||
      lower.includes("verify_paystack") ||
      lower.includes("missing")
    ) {
      return "Checkout is not available right now. Please try again shortly or contact support.";
    }
    if (lower.includes("signed-in user") || lower.includes("login session")) {
      return "Your login session needs a quick refresh. Please sign in again before paying.";
    }
    if (lower.includes("student profile")) {
      return "Please complete your registration details before starting payment.";
    }
    if (lower.includes("network") || lower.includes("offline")) {
      return "Network issue detected. Check your connection and try again.";
    }

    return raw || "Could not start checkout. Please try again or contact support.";
  };

  const handlePayment = async () => {
    try {
      if (disablePay) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setPaymentState("processing");
      setErrorMsg("");

      const currentAuthUid = auth.currentUser?.uid || "";

      if (!currentAuthUid) {
        throw new Error(
          "Your login session is not ready. Please sign in again.",
        );
      }

      if (currentAuthUid !== u.uid) {
        throw new Error("Signed-in user does not match this payment session.");
      }

      const profile = await registrationStore.getUserProfile(currentAuthUid);
      if (!profile) {
        throw new Error(
          "Your student profile is missing. Please complete registration first.",
        );
      }


      // ✅ store pending payment first (so Admin can see it)
      await registrationStore.setPendingPayment(currentAuthUid, {
        kind: u.isTopUp ? "topup" : "initial",
        weeks: topUpWeeks,
        amount: totalPrice,
        reference,
      });

      // ✅ Do NOT update cohort fields here anymore.
      // ContinueRegistration already saved them.

      initializePayment({
        onSuccess: async (res: any) => {
          const r = String(res?.reference || "").trim() || reference;
          await verifyAndFinalize(r);
        },
        onClose: () => {
          setPaymentState("idle");
          inFlightRef.current = false;
        },
      });
    } catch (e: any) {
      console.error("Payment init failed:", e);
      setPaymentState("failed");
      setErrorMsg(friendlyPaymentStartError(e));
      inFlightRef.current = false;
    }
  };

  const SummaryRow = ({
    label,
    value,
    mono,
  }: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-6 py-2">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm font-bold text-blue-900 dark:text-white text-right ${
          mono ? "font-mono break-all" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );

  // -----------------------------
  // ✅ Guard: missing session
  // -----------------------------
  if (!u?.uid || !u?.email) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Payment Session Missing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">
            The payment page didn’t receive your session data.
          </p>

          <button
            onClick={() => onNavigate("student-dashboard")}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // SUCCESS
  // -----------------------------
  if (paymentState === "success") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-blue-900/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-500/20">
                <span className="text-teal-600 dark:text-teal-400 text-2xl font-black">
                  ✓
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-black text-blue-900 dark:text-white">
                  Payment Verified 🎉
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Your access has been activated successfully.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur p-5 mb-6">
              <div className="flex items-center justify-between gap-4">
                <Badge tone="teal">ACTIVE</Badge>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Total Weeks
                  </p>
                  <p className="text-xl font-black text-blue-900 dark:text-white">
                    {newTotalWeeks} / {courseMaxWeeks}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <SummaryRow label="Cohort" value={cohortLabel} />
                <SummaryRow label="Cohort Key" value={cohortKey} mono />
                <SummaryRow label="Reference" value={reference} mono />
              </div>
            </div>

            <div className="mb-6 p-5 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10">
              <h2 className="font-black text-blue-900 dark:text-white mb-2">
                Next Step 🚀
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You can now continue inside your Student Dashboard and access
                sessions based on your paid weeks.
              </p>
            </div>

            <button
              onClick={() => onNavigate("student-dashboard")}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Go Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // VERIFYING
  // -----------------------------
  if (paymentState === "verifying") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-900/10 blur-2xl" />

          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/15">
              <span className="text-blue-900 dark:text-teal-400 text-2xl font-black">
                ⏳
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-blue-900 dark:text-white">
                Verifying Payment…
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Payment received. We’re confirming it securely with Paystack.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 mb-6">
            <SummaryRow label="Cohort" value={cohortLabel} />
            <SummaryRow label="Reference" value={reference} mono />
            <SummaryRow
              label="Amount"
              value={`₦${totalPrice.toLocaleString()}`}
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
              Please don’t close this page…
            </p>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.2s]" />
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.1s]" />
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" />
            </div>
          </div>

          <button
            onClick={() => onNavigate("student-dashboard")}
            className="mt-6 w-full text-sm font-bold text-blue-900 dark:text-white underline"
          >
            I’ll come back later
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // FAILED
  // -----------------------------
  if (paymentState === "failed") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-red-100 dark:bg-red-500/20">
              <span className="text-red-600 dark:text-red-400 text-2xl font-black">
                ✕
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-red-600 dark:text-red-400">
                Payment Failed
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Transaction could not be verified. Please try again.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm mb-6">
            <p className="font-black text-red-700 dark:text-red-200">
              {errorMsg || "Verification failed."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentState("idle")}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg"
            >
              Retry Payment
            </button>

            <button
              onClick={() => onNavigate("student-dashboard")}
              className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-900 dark:text-white font-black py-4 rounded-2xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // MAIN UI (Premium)
  // -----------------------------
  const kindLabel = u.isTopUp ? "Top-up" : "Initial Payment";

  const capWarning =
    u.isTopUp && maxAllowedWeeks <= 0
      ? `You’ve already completed the full course duration (${courseMaxWeeks} weeks).`
      : "";

  const envWarning =
    !FUNCTION_URL || !publicKey
      ? "Checkout is temporarily unavailable. Please contact support so we can help you complete payment."
      : "";
  const courseWarning =
    courseConfigLoading
      ? "Syncing the current course price before checkout..."
      : courseConfigError;

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white">
            Secure Checkout
          </h1>
          <p className="text-slate-500 dark:text-slate-300 mt-2">
            Complete your payment to unlock your learning access
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            <Badge tone="blue">{kindLabel}</Badge>
            <Badge tone="slate">{safePath}</Badge>
            <Badge tone="teal">{cohortLabel}</Badge>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Weeks selected: <span className="font-bold">{topUpWeeks}</span> •
            Max allowed: <span className="font-bold">{maxAllowedWeeks}</span> •
            ₦{weeklyRate.toLocaleString()}/wk
          </p>
          {courseWarning ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm font-bold text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100">
              {courseWarning}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 relative">
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-blue-900/10 blur-2xl" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                        Order Summary
                      </p>
                      <h2 className="text-2xl font-black text-blue-900 dark:text-white">
                        {safePath}
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-2">
                        {u.isTopUp ? (
                          <>
                            You’re adding{" "}
                            <span className="font-black text-blue-900 dark:text-white">
                              {topUpWeeks} week(s)
                            </span>{" "}
                            to your existing access.
                          </>
                        ) : (
                          <>
                            This will activate{" "}
                            <span className="font-black text-blue-900 dark:text-white">
                              {topUpWeeks} week(s)
                            </span>{" "}
                            of access to sessions & recordings.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Total
                      </p>

                      <p className="text-3xl font-black text-teal-600">
                        ₦{totalPrice.toLocaleString()}
                      </p>

                      <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                        <p>
                          Course ({topUpWeeks} × ₦{weeklyRate.toLocaleString()})
                        </p>

                        <p>Course amount: ₦{basePrice.toLocaleString()}</p>
                        <p>Paystack may add gateway charges at checkout.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur p-6">
                    <SummaryRow label="Cohort" value={cohortLabel} />
                    <SummaryRow label="Cohort Key" value={cohortKey} mono />
                    <SummaryRow label="Reference" value={reference} mono />
                    <SummaryRow
                      label="Course Amount"
                      value={`₦${basePrice.toLocaleString()}`}
                    />
                    {u.isTopUp ? (
                      <>
                        <SummaryRow
                          label="Current Weeks"
                          value={`${originalWeeks} / ${courseMaxWeeks}`}
                        />
                        <SummaryRow
                          label="After Payment"
                          value={`${newTotalWeeks} / ${courseMaxWeeks}`}
                        />
                      </>
                    ) : (
                      <SummaryRow
                        label="After Payment"
                        value={`${newTotalWeeks} / ${courseMaxWeeks}`}
                      />
                    )}
                  </div>

                  {(capWarning || envWarning) && (
                    <div className="mt-6 p-4 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200 text-sm font-bold">
                      {capWarning || envWarning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                Checkout
              </p>

              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Payable
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-900 dark:text-white">
                      ₦{totalPrice.toLocaleString()}
                    </span>

                    <div className="mt-1 space-y-1 text-[11px] text-slate-400">
                      <p>Course amount: ₦{basePrice.toLocaleString()}</p>
                      <p>Gateway charges may be added by Paystack.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-300">
                  <p>
                    • Payment processor:{" "}
                    <span className="font-bold">Paystack</span>
                  </p>
                  <p>
                    • Email: <span className="font-mono">{u.email}</span>
                  </p>
                </div>
              </div>

              <button
                disabled={disablePay}
                onClick={handlePayment}
                className="mt-6 w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-black py-5 rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {paymentState === "processing" ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                    <span>Opening Paystack…</span>
                  </div>
                ) : totalPrice <= 0 ? (
                  "Nothing to Pay"
                ) : (
                  `Pay ₦${totalPrice.toLocaleString()} Securely`
                )}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                Payments are processed securely via Paystack.
              </p>

              <button
                onClick={() => onNavigate("student-dashboard")}
                className="mt-6 w-full text-sm font-bold text-blue-900 dark:text-white underline"
              >
                Cancel & Return to Dashboard
              </button>

              {!publicKey || !FUNCTION_URL ? (
                <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
                  Checkout needs a quick setup check. Please contact support if
                  you need to pay now.
                </div>
              ) : null}
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-400">
              If Paystack window doesn’t open, check pop-ups are allowed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
