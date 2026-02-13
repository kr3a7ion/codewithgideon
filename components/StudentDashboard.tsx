import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import {
  RegistrationEntry,
  registrationStore,
} from "../services/registrationStore";

type ActiveCohort = { id: string; label: string };

interface StudentDashboardProps {
  profile: RegistrationEntry | null;
  onNavigate: (view: View, extraData?: any) => void;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  profile,
  onNavigate,
  onLogout,
}) => {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpWeeks, setTopUpWeeks] = useState("4");

  const [activeCohort, setActiveCohort] = useState<ActiveCohort | null>(null);
  const [cohortLoading, setCohortLoading] = useState(false);

  // ✅ Always attempt to load active cohort once profile exists
  useEffect(() => {
    let mounted = true;

    const loadActive = async () => {
      if (!profile) return;

      setCohortLoading(true);
      try {
        const active = await registrationStore.getActiveCohort();
        if (!mounted) return;

        setActiveCohort(active);

        // If user profile missing cohort, write it back
        const missing = !profile.cohortId || !profile.cohortLabel;
        if (missing && active?.id && active?.label) {
          await registrationStore.updateUserCohort(
            profile.uid,
            active.id,
            active.label,
          );
        }
      } catch (e) {
        console.error("Failed to load active cohort:", e);
      } finally {
        if (mounted) setCohortLoading(false);
      }
    };

    loadActive();
    return () => {
      mounted = false;
    };
  }, [profile?.uid]);

  if (!profile) return null;

  const weeklyRate = 10000;

  const totalProgramWeeks = profile.path.includes("Flutter")
    ? 12
    : profile.path.includes("Web")
      ? 8
      : 4;

  const paidWeeks = Math.max(0, Number(profile.weeksToCommit || 0));
  const remainingWeeks = Math.max(0, totalProgramWeeks - paidWeeks);

  const progressPercent = Math.min(
    (Number(profile.weeksToCommit || 0) / totalProgramWeeks) * 100,
    100,
  );

  const hasPendingInitial = profile.status === "Pending";
  const hasPendingTopUp =
    profile.status === "Complete" &&
    profile.pendingPayment?.status === "Pending";
  const hasAnyPending = hasPendingInitial || hasPendingTopUp;

  // ✅ Only allow top up when there is room left and nothing pending
  const canTopUp = !hasAnyPending && remainingWeeks > 0;

  // ✅ Clamp topUpWeeks when modal is open + remaining changes
  useEffect(() => {
    if (!isTopUpOpen) return;

    const current = Math.max(1, parseInt(topUpWeeks || "1", 10) || 1);
    const clamped = Math.min(current, Math.max(1, remainingWeeks || 1));

    if (String(clamped) !== topUpWeeks) {
      setTopUpWeeks(String(clamped));
    }
  }, [isTopUpOpen, remainingWeeks, topUpWeeks]);

  // ✅ RESOLVED COHORT (single source for UI + navigation)
  const resolvedCohort = useMemo(() => {
    const id = profile.cohortId || activeCohort?.id || "CWG-DEFAULT";
    const label =
      profile.cohortLabel || activeCohort?.label || "Current Cohort";
    return { id, label };
  }, [
    profile.cohortId,
    profile.cohortLabel,
    activeCohort?.id,
    activeCohort?.label,
  ]);

  const cohortId = resolvedCohort.id;
  const cohortLabel = resolvedCohort.label;

  // ✅ Build safe payload for payment
  const buildPaymentPayload = () => {
    const base = {
      uid: profile.uid,
      email: profile.email,
      path: profile.path,
      cohortId,
      cohortLabel,
    };

    if (profile.pendingPayment?.status === "Pending") {
      const pp = profile.pendingPayment;
      return {
        selectedPath: profile.path,
        userData: {
          ...base,
          weeksToCommit: Number(pp.weeks) || 1,
          originalWeeks: Number(profile.weeksToCommit) || 0,
          isTopUp: pp.kind === "topup",
          reference: pp.reference,
        },
      };
    }

    return {
      selectedPath: profile.path,
      userData: {
        ...base,
        weeksToCommit: Number(profile.weeksToCommit) || 1,
        isTopUp: false,
      },
    };
  };

  const handleContinuePayment = () => {
    const payload = buildPaymentPayload();

    // ✅ Safety: never navigate with missing userData
    if (!payload?.userData?.uid || !payload?.userData?.email) {
      console.error("Payment payload invalid:", payload);
      return;
    }

    onNavigate("payment", payload);
  };

  const handleTopUp = () => {
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
        weeksToCommit: weeks,
        originalWeeks: Number(profile.weeksToCommit) || 0,
        isTopUp: true,
        cohortId,
        cohortLabel,
      },
    });

    setIsTopUpOpen(false);
  };

  const joinedDate = new Date(profile.timestamp).toLocaleDateString();

  // ✅ Small loading UI helpers (no logic changes)
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

  // ✅ Clamp total due display in modal
  const selectedWeeksClamped = Math.min(
    Math.max(1, parseInt(topUpWeeks || "1", 10) || 1),
    Math.max(1, remainingWeeks || 1),
  );

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
                      {profile.weeksToCommit} / {totalProgramWeeks} Weeks
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
                  {[1, 2, 3, 4]
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
