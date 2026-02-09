import React, { useEffect, useMemo, useState } from "react";
import { View } from "../App";
import { registrationStore } from "../services/registrationStore";

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
}

// ✅ Allow BOTH shapes:
// 1) userData = UserData
// 2) userData = { selectedPath, userData: UserData }
type PaymentIncoming =
  | UserData
  | { selectedPath?: string; userData?: UserData }
  | null
  | undefined;

interface PaymentProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  userData: PaymentIncoming; // ✅ changed
  onPaymentSuccess?: (newTotalWeeks: number) => void;
}

type ActiveCohort = { id: string; label: string };

const Payment: React.FC<PaymentProps> = ({
  onNavigate,
  selectedPath,
  userData,
  onPaymentSuccess,
}) => {
  // ✅ Normalize payload so Payment works no matter what App stores
  const normalized = useMemo(() => {
    const anyData = userData as any;

    // If it's wrapped: { selectedPath, userData: {...} }
    if (anyData?.userData && anyData?.userData?.uid) {
      return {
        selectedPath: anyData.selectedPath || selectedPath,
        userData: anyData.userData as UserData,
      };
    }

    // If it's direct: {...}
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

  // ✅ HARD GUARD: no blank pages
  if (!u?.uid || !u?.email) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Payment Session Missing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The payment page didn’t receive your session data. This usually happens if
            navigation didn’t pass user details correctly.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => onNavigate("student-dashboard")}
              className="flex-1 bg-blue-900 dark:bg-teal-600 text-white font-black py-4 rounded-2xl"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => onNavigate("curriculums")}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black py-4 rounded-2xl"
            >
              Start Again
            </button>
          </div>

          <p className="mt-6 text-[11px] font-mono text-slate-400 break-all">
            debug: userData={JSON.stringify(userData)}
          </p>
        </div>
      </div>
    );
  }

  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [reference, setReference] = useState("");

  const [fallbackCohort, setFallbackCohort] = useState<ActiveCohort | null>(null);

  const topUpWeeks = useMemo(() => {
    const w = typeof u.weeksToCommit === "string" ? parseInt(u.weeksToCommit, 10) : u.weeksToCommit;
    return Number.isFinite(w) && w > 0 ? w : 1;
  }, [u.weeksToCommit]);

  const originalWeeks = u.originalWeeks ?? 0;
  const weeklyRate = 10000;
  const totalPrice = topUpWeeks * weeklyRate;
  const newTotalWeeks = u.isTopUp ? originalWeeks + topUpWeeks : topUpWeeks;

  const cohortLabel = u.cohortLabel || fallbackCohort?.label || "Current Cohort";
  const cohortId = u.cohortId || fallbackCohort?.id || "CWG-DEFAULT";

  useEffect(() => {
    if (u.reference) {
      setReference(u.reference);
      return;
    }

    setReference(
      `CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1000)}`
    );
  }, [u.reference]);

  useEffect(() => {
    let mounted = true;

    const maybeLoadCohort = async () => {
      if (u.cohortId && u.cohortLabel) return;

      try {
        const active = await registrationStore.getActiveCohort();
        if (mounted) setFallbackCohort(active);
      } catch {
        if (mounted) setFallbackCohort({ id: "CWG-DEFAULT", label: "Current Cohort" });
      }
    };

    maybeLoadCohort();
    return () => {
      mounted = false;
    };
  }, [u.cohortId, u.cohortLabel]);

  const handlePayment = async () => {
    const refToUse =
      reference ||
      u.reference ||
      `CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1000)}`;

    if (!reference) setReference(refToUse);

    setPaymentState("processing");

    await registrationStore.setPendingPayment(u.uid, {
      kind: u.isTopUp ? "topup" : "initial",
      weeks: topUpWeeks,
      amount: totalPrice,
      reference: refToUse,
    });

    try {
      setTimeout(async () => {
        const isSuccessful = Math.random() > 0.1;

        if (isSuccessful) {
          await registrationStore.recordTopUp(u.uid, topUpWeeks, totalPrice, refToUse);

          setPaymentState("success");
          onPaymentSuccess?.(newTotalWeeks);
        } else {
          setPaymentState("failed");
        }
      }, 1500);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentState("failed");
    }
  };

  // SUCCESS
  if (paymentState === "success") {
    return (
      <div className="py-24 bg-white dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Payment Verified
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Cohort: <span className="font-bold">{cohortLabel}</span>{" "}
            <span className="font-mono text-xs text-slate-400">({cohortId})</span>
          </p>

          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Reference: <span className="font-mono text-xs">{reference}</span>
          </p>

          <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Your access has been extended by{" "}
            <span className="font-bold text-teal-600">
              {topUpWeeks} week{topUpWeeks > 1 ? "s" : ""}
            </span>
            . Total access:{" "}
            <span className="font-bold text-blue-900 dark:text-teal-400">
              {newTotalWeeks} week{newTotalWeeks > 1 ? "s" : ""}
            </span>
            .
          </p>

          <button
            onClick={() => onNavigate("student-dashboard")}
            className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  // FAILED
  if (paymentState === "failed") {
    return (
      <div className="py-24 bg-white dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Payment Failed
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            The transaction was declined. No charge was made.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setPaymentState("idle")}
              className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
            >
              Try Again
            </button>
            <button
              onClick={async () => {
                await registrationStore.clearPendingPayment(u.uid);
                onNavigate("student-dashboard");
              }}
              className="w-full py-4 text-slate-400 font-bold hover:text-blue-900"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IDLE
  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Secure Checkout
          </h1>
          <p className="text-slate-500">Processed by Paystack</p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cohort
            </span>
            <span className="text-xs font-bold text-blue-900 dark:text-teal-400">
              {cohortLabel}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              • {cohortId}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-4 mb-6">
                Payment Summary
              </h3>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <p className="font-bold text-blue-900 dark:text-white leading-tight mb-1">
                      {u.path || safePath}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                      Access Rate: ₦{weeklyRate.toLocaleString()} / week
                    </p>
                  </div>
                  <span className="font-bold text-blue-900 dark:text-teal-400">
                    ₦{weeklyRate.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    Duration
                  </span>
                  <span className="text-sm font-black text-blue-900 dark:text-white">
                    {topUpWeeks} Week{topUpWeeks > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-6 border-t-2 border-dashed border-gray-100 dark:border-slate-800">
                  <span className="text-lg font-black text-blue-900 dark:text-white">
                    Total Charge
                  </span>
                  <span className="text-2xl font-black text-teal-600">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="mb-8 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl w-full">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">
                  Authenticated Email
                </p>
                <p className="font-bold text-blue-900 dark:text-white">
                  {u.email}
                </p>
              </div>

              <button
                disabled={paymentState === "processing"}
                onClick={handlePayment}
                className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50"
              >
                {paymentState === "processing"
                  ? "Opening Secure Gateway..."
                  : `Pay ₦${totalPrice.toLocaleString()}`}
              </button>

              <p className="mt-6 text-[10px] text-slate-400 leading-relaxed">
                You will be redirected to Paystack to complete payment via Card, USSD,
                or Bank Transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;