import React, { useState } from "react";
import { View } from "../App";
import { RegistrationEntry } from "../services/registrationStore";

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

  if (!profile) return null;

  const weeklyRate = 10000;

  const totalProgramWeeks = profile.path.includes("Flutter")
    ? 12
    : profile.path.includes("Web")
    ? 8
    : 4;

  const progressPercent = Math.min(
    (profile.weeksToCommit / totalProgramWeeks) * 100,
    100
  );

  // ✅ pending initial (registration not activated)
  const hasPendingInitial = profile.status === "Pending";

  // ✅ pending top-up (subscription active but top-up payment not completed)
  const hasPendingTopUp =
    profile.status === "Complete" && profile.pendingPayment?.status === "Pending";

  // ✅ any pending payment blocks new top-ups
  const hasAnyPending = hasPendingInitial || hasPendingTopUp;

  const continuePaymentData = () => {
    // If we have a stored pending payment, reuse it (perfect for failed/cancelled top-ups)
    if (profile.pendingPayment?.status === "Pending") {
      const pp = profile.pendingPayment;
      return {
        selectedPath: profile.path,
        userData: {
          uid: profile.uid,
          email: profile.email,
          path: profile.path,
          weeksToCommit: pp.weeks,
          originalWeeks: profile.weeksToCommit,
          isTopUp: pp.kind === "topup",

          // ✅ ensure cohort displays correctly
          cohortId: profile.cohortId,
          cohortLabel: profile.cohortLabel,

          // (optional) if your Payment page wants to keep same ref:
          reference: pp.reference,
        },
      };
    }

    // Otherwise it’s initial pending payment
    return {
      selectedPath: profile.path,
      userData: {
        uid: profile.uid,
        email: profile.email,
        path: profile.path,
        weeksToCommit: profile.weeksToCommit,
        isTopUp: false,
        cohortId: profile.cohortId,
        cohortLabel: profile.cohortLabel,
      },
    };
  };

  const handleContinuePayment = () => {
    onNavigate("payment", continuePaymentData());
  };

  const handleTopUp = () => {
    // ✅ stop user from starting a new top-up while another payment is pending
    if (hasAnyPending) {
      setIsTopUpOpen(false);
      return;
    }

    onNavigate("payment", {
      selectedPath: profile.path,
      userData: {
        uid: profile.uid,
        email: profile.email,
        path: profile.path,

        weeksToCommit: topUpWeeks,
        originalWeeks: profile.weeksToCommit,
        isTopUp: true,

        cohortId: profile.cohortId,
        cohortLabel: profile.cohortLabel,
      },
    });

    setIsTopUpOpen(false);
  };

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
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Card */}
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

              {/* ✅ Action Area: Continue payment for initial OR top-up */}
              <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-white">
                    {hasAnyPending ? "Finish your payment" : "Ready for more?"}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hasAnyPending
                      ? "You have an incomplete payment. Continue to checkout to complete it before starting a new top-up."
                      : "Add more weeks to your subscription to stay in the live cohort."}
                  </p>
                </div>

                {hasAnyPending ? (
                  <button
                    onClick={handleContinuePayment}
                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap hover:scale-105"
                  >
                    Continue to Payment
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTopUpOpen(true)}
                    className="px-8 py-4 bg-blue-900 dark:bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    Pay for More Weeks
                  </button>
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
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Joined</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">
                    {new Date(profile.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">
                    {profile.phone}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cohort</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">
                    {profile.cohortLabel || "Current Cohort"}
                    <span className="ml-2 font-mono text-[10px] text-slate-400">
                      {profile.cohortId ? `• ${profile.cohortId}` : ""}
                    </span>
                  </span>
                </div>

                {profile.pendingPayment?.status === "Pending" && (
                  <div className="mt-4 p-4 rounded-2xl bg-orange-50 text-orange-700 border border-orange-100">
                    <p className="text-xs font-black uppercase tracking-widest">
                      Pending Payment
                    </p>
                    <p className="text-sm font-bold mt-1">
                      {profile.pendingPayment.kind === "topup" ? "Top-up" : "Initial"} •{" "}
                      {profile.pendingPayment.weeks} week(s) • ₦
                      {profile.pendingPayment.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-mono mt-1 opacity-80">
                      {profile.pendingPayment.reference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Up Modal */}
        {isTopUpOpen && !hasAnyPending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">
                Extend Your Access
              </h3>
              <p className="text-sm text-slate-500 mb-8">
                Select how many weeks you want to pay for today.
              </p>

              <div className="space-y-4 mb-8">
                <select
                  value={topUpWeeks}
                  onChange={(e) => setTopUpWeeks(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  <option value="1">1 Week (₦10,000)</option>
                  <option value="2">2 Week (₦20,000)</option>
                  <option value="3">3 Weeks (₦30,000)</option>
                  <option value="4">4 Weeks (₦40,000)</option>
                </select>

                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Total Due
                  </span>
                  <span className="text-2xl font-black text-teal-600">
                    ₦{(parseInt(topUpWeeks) * weeklyRate).toLocaleString()}
                  </span>
                </div>
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

        {/* If user tries top-up while pending */}
        {isTopUpOpen && hasAnyPending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-3">
                Pending Payment
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Please complete your pending payment before starting a new top-up.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsTopUpOpen(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsTopUpOpen(false);
                    handleContinuePayment();
                  }}
                  className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg"
                >
                  Continue to Payment
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