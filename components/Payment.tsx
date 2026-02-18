import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "../src/App";
import { registrationStore, CourseDoc } from "../services/registrationStore";
import { usePaystackPayment } from "react-paystack";

interface UserData {
  uid: string;
  email: string;
  path: string;
  weeksToCommit: number | string;
  reference?: string;
  originalWeeks?: number;
  isTopUp?: boolean;
  cohortId?: string;
  cohortLabel?: string;

  // optional (if registration passed it)
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

type ActiveCohort = { id: string; label: string };

const PINNED = [
  { title: "Flutter & Mobile App Development", weeks: 12, rate: 10000 },
  { title: "Web Development & WordPress", weeks: 8, rate: 10000 },
  { title: "AI-Assisted Development", weeks: 4, rate: 10000 },
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
  const u = normalized.userData;

  if (!u?.uid || !u?.email) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Payment Session Missing
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            The payment page didn’t receive your session data.
          </p>

          <button
            onClick={() => onNavigate("student-dashboard")}
            className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "verifying" | "success" | "failed"
  >("idle");

  const [fallbackCohort, setFallbackCohort] = useState<ActiveCohort | null>(
    null,
  );

  // ✅ course config in Payment too
  const [courseMaxWeeks, setCourseMaxWeeks] = useState<number>(
    u.courseDurationWeeks || 4,
  );
  const [courseWeeklyRate, setCourseWeeklyRate] = useState<number>(
    u.weeklyRate || 10000,
  );

  useEffect(() => {
    let mounted = true;

    const loadCourseConfig = async () => {
      // if registration already passed weeklyRate & duration, use them
      if (u.courseDurationWeeks && u.weeklyRate) return;

      const pinned = PINNED.find(
        (p) =>
          p.title.trim().toLowerCase() ===
          String(safePath).trim().toLowerCase(),
      );
      if (pinned) {
        if (!mounted) return;
        setCourseMaxWeeks(pinned.weeks);
        setCourseWeeklyRate(pinned.rate);
        return;
      }

      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c) => c.isActive !== false);
        const found = active.find(
          (c) =>
            String(c.title || "")
              .trim()
              .toLowerCase() === String(safePath).trim().toLowerCase(),
        );

        if (!mounted) return;

        if (found) {
          setCourseMaxWeeks(parseWeeksFromDuration(found.duration, 4));
          setCourseWeeklyRate(
            parsePricePerWeek(found.priceLabel || "₦10k/wk", 10000),
          );
        } else {
          // fallback
          setCourseMaxWeeks(4);
          setCourseWeeklyRate(10000);
        }
      } catch (e) {
        console.error("Failed to load course config:", e);
        if (!mounted) return;
        setCourseMaxWeeks(4);
        setCourseWeeklyRate(10000);
      }
    };

    loadCourseConfig();
    return () => {
      mounted = false;
    };
  }, [safePath, u.courseDurationWeeks, u.weeklyRate]);

  // ✅ Weeks requested
  const requestedWeeks = useMemo(() => {
    const w =
      typeof u.weeksToCommit === "string"
        ? parseInt(u.weeksToCommit, 10)
        : u.weeksToCommit;
    return Number.isFinite(w) && w > 0 ? w : 1;
  }, [u.weeksToCommit]);

  const originalWeeks = u.originalWeeks ?? 0;

  // ✅ FIX #1: correct cap logic (allow 0 remaining for topup)
  const maxAllowedWeeks = useMemo(() => {
    if (!u.isTopUp) return Math.max(1, courseMaxWeeks);
    const remaining = Math.max(0, courseMaxWeeks - originalWeeks);
    return remaining;
  }, [u.isTopUp, courseMaxWeeks, originalWeeks]);

  // ✅ FIX #1 continued: if maxAllowedWeeks is 0, topUpWeeks becomes 0
  const topUpWeeks = useMemo(() => {
    if (maxAllowedWeeks <= 0) return 0;
    return clamp(requestedWeeks, 1, maxAllowedWeeks);
  }, [requestedWeeks, maxAllowedWeeks]);

  const weeklyRate = courseWeeklyRate || 10000;
  const totalPrice = topUpWeeks * weeklyRate;

  const newTotalWeeks = u.isTopUp ? originalWeeks + topUpWeeks : topUpWeeks;

  const cohortLabel =
    u.cohortLabel || fallbackCohort?.label || "Current Cohort";
  const cohortId = u.cohortId || fallbackCohort?.id || "CWG-DEFAULT";

  const referenceRef = useRef(
    u.reference ||
      `CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(
        Math.random() * 1000,
      )}`,
  );
  const reference = referenceRef.current;

  useEffect(() => {
    const loadCohort = async () => {
      if (u.cohortId && u.cohortLabel) return;
      try {
        const active = await registrationStore.getActiveCohort();
        setFallbackCohort(active);
      } catch {
        setFallbackCohort({ id: "CWG-DEFAULT", label: "Current Cohort" });
      }
    };
    loadCohort();
  }, [u.cohortId, u.cohortLabel]);

  const initializePayment = usePaystackPayment({
    reference,
    email: u.email,
    amount: totalPrice * 100,
    publicKey,
  });

  const Loader = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center gap-4 py-2">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
        {label}
      </p>
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.2s]" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.1s]" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" />
      </div>
    </div>
  );

  // ✅ FIX #2: one disable flag (prevents pay if no remaining weeks)
  const disablePay =
    paymentState === "processing" ||
    paymentState === "verifying" ||
    totalPrice <= 0 ||
    (u.isTopUp && maxAllowedWeeks <= 0);

  const verifyAndFinalize = async (paystackRef: string) => {
    try {
      if (!FUNCTION_URL) throw new Error("Missing VITE_VERIFY_PAYSTACK_URL");
      if (!publicKey) throw new Error("Missing VITE_PAYSTACK_PUBLIC_KEY");

      setPaymentState("verifying");

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paystackRef,
          uid: u.uid,
          expectedAmount: totalPrice * 100,
          weeks: topUpWeeks,
          kind: u.isTopUp ? "topup" : "initial",
          cohortId,
          cohortLabel,
          path: safePath,

          // helpful metadata
          courseMaxWeeks,
          weeklyRate,
        }),
      });

      const raw = await resp.text();

      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          `Verify returned non-JSON. Status ${resp.status}. Body: ${raw.slice(
            0,
            250,
          )}`,
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
    } catch (err) {
      setPaymentState("failed");
    }
  };

  const handlePayment = async () => {
    try {
      // ✅ FIX #2 continued: hard block
      if (disablePay) return;

      setPaymentState("processing");

      await registrationStore.setPendingPayment(u.uid, {
        kind: u.isTopUp ? "topup" : "initial",
        weeks: topUpWeeks,
        amount: totalPrice,
        reference,
      });

      await new Promise((r) => setTimeout(r, 120));

      initializePayment({
        onSuccess: async (res: any) => {
          await verifyAndFinalize(res?.reference || reference);
        },
        onClose: () => setPaymentState("idle"),
      });
    } catch {
      setPaymentState("failed");
    }
  };

  // SUCCESS
  if (paymentState === "success") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
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

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 text-sm mb-6">
            <p>
              Cohort:{" "}
              <span className="font-bold text-blue-900 dark:text-white">
                {cohortLabel}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Ref: {reference}</p>
          </div>

          <div className="mb-6 p-5 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10">
            <h2 className="font-black text-blue-900 dark:text-white mb-2">
              Next Step 🚀
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You can now log in on the{" "}
              <span className="font-bold">Code with Gideon</span> mobile app to
              start your live classes, recordings, and community learning.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Download the App
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                disabled
                className="py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-black"
              >
                Play Store (Soon)
              </button>

              <button
                disabled
                className="py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-black"
              >
                App Store (Soon)
              </button>

              <button
                disabled
                className="py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-black"
              >
                Download APK (Soon)
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2">
              App links will appear here once the mobile release is live.
            </p>
          </div>

          <button
            onClick={() => onNavigate("student-dashboard")}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // VERIFYING
  if (paymentState === "verifying") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/15">
              <span className="text-blue-900 dark:text-teal-400 text-2xl font-black">
                ⏳
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-blue-900 dark:text-white">
                Pending Verification…
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Payment received. We’re confirming it securely with Paystack.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 text-sm mb-6">
            <p>
              Cohort:{" "}
              <span className="font-bold text-blue-900 dark:text-white">
                {cohortLabel}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Ref: {reference}</p>
          </div>

          <Loader label="Verifying your payment… please don’t close this page." />

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

  // FAILED
  if (paymentState === "failed") {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-3xl shadow-xl border border-red-200 dark:border-red-500/30">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentState("idle")}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl"
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

  // MAIN UI
  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white">
            Secure Checkout
          </h1>
          <p className="text-slate-500 dark:text-slate-300 mt-2">
            Complete your payment to unlock your learning access 🚀
          </p>
          <p className="text-slate-500 dark:text-slate-300 mt-2">
            Registration Completed!
          </p>

          <p className="text-[11px] text-slate-400 mt-2">
            Weeks selected: {topUpWeeks} / Max allowed: {maxAllowedWeeks}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-slate-500">Cohort</p>
              <p className="font-black text-blue-900 dark:text-white">
                {cohortLabel}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-black text-teal-600">
                ₦{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 mb-6">
            <p className="text-xs text-slate-500">Payment Reference</p>
            <p className="font-mono text-sm text-blue-900 dark:text-white break-all">
              {reference}
            </p>
          </div>

          {/* ✅ FIX #3: clean message when topup not possible (no layout change) */}
          {u.isTopUp && maxAllowedWeeks <= 0 && (
            <div className="mb-6 p-4 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200 text-sm font-bold">
              You’ve already completed the full course duration (
              {courseMaxWeeks} weeks). No top-up is needed.
            </div>
          )}

          <button
            disabled={disablePay}
            onClick={handlePayment}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-black py-5 rounded-2xl shadow-lg"
          >
            {paymentState === "processing" ? (
              <div className="flex items-center justify-center gap-3">
                <span className="h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                <span>Opening Paystack…</span>
              </div>
            ) : (
              `Pay ₦${totalPrice.toLocaleString()}`
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
        </div>
      </div>
    </div>
  );
};

export default Payment;
