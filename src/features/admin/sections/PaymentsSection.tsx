/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Copy } from "lucide-react";
import {
  paymentRecordAmount,
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
  adminMobileRecordClass,
  adminFieldLabelClass,
  adminFieldValueClass,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const PaymentsSection: React.FC = () => {
  const {
    activeAdminSection,
    pendingBusyUid,
    paymentRecords,
    paymentRecordsLoading,
    paymentRecordsError,
    busy,
    fetchRegistrations,
    fetchPaymentRecords,
    pendingPayments,
    registrationsByUid,
    formatPaymentAmount,
    formatPaymentDate,
    copyToClipboard,
    clearPending,
    approvePending,
  } = useAdmin();
  return (
    <>
      {/* Pending Payments */}
      {activeAdminSection === "payments" && (
        <div className={`mb-8 p-5 md:p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Pending Payments</h2>
              <p className={sectionCopyClass}>
                Reconcile pending Paystack references only after checking
                the gateway dashboard.
              </p>
            </div>

            <button
              onClick={() =>
                Promise.all([fetchRegistrations(), fetchPaymentRecords()])
              }
              className={subtleActionClass}
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Verified Payment Records
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {paymentRecords.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Verified Payments Total
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                ₦
                {paymentRecords
                  .reduce(
                    (sum, payment) => sum + paymentRecordAmount(payment),
                    0,
                  )
                  .toLocaleString()}
              </p>
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              No pending payments right now.
            </div>
          ) : (
            <>
            <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
              Manual approval is an admin override. It credits learner
              access without re-running Paystack verification, so confirm
              the transaction reference in Paystack before approving.
            </div>

            <div className="space-y-3 lg:hidden">
              {pendingPayments.map((r) => {
                const p = (r as any).pendingPayment;
                return (
                  <div key={`${r.uid}-mobile-pending`} className={adminMobileRecordClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {r.fullName}
                        </p>
                        <p className="mt-1 break-all text-xs font-medium text-slate-500 dark:text-slate-400">
                          {r.email}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
                        {p?.kind || "payment"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className={adminFieldLabelClass}>Weeks</p>
                        <p className={adminFieldValueClass}>{p?.weeks || "—"}</p>
                      </div>
                      <div>
                        <p className={adminFieldLabelClass}>Amount</p>
                        <p className="mt-1 text-sm font-black text-teal-600 dark:text-teal-300">
                          ₦{Number(p?.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
                      <p className={adminFieldLabelClass}>Reference</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                        {p?.reference || "No reference"}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(String(p?.reference || ""))
                        }
                        className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:underline dark:text-blue-400"
                      >
                        Copy Ref
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <BusyButton
                        busy={pendingBusyUid === r.uid}
                        onClick={() => approvePending(r)}
                        className="justify-center rounded-xl bg-teal-600 px-3 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90"
                        busyText="Reconciling..."
                      >
                        Admin Override
                      </BusyButton>
                      <BusyButton
                        busy={pendingBusyUid === r.uid}
                        onClick={() => clearPending(r.uid)}
                        className="justify-center rounded-xl bg-orange-600 px-3 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90"
                        busyText="Clearing..."
                      >
                        Clear
                      </BusyButton>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Student
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Kind
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Weeks
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Reference
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {pendingPayments.map((r) => {
                    const p = (r as any).pendingPayment;
                    return (
                      <tr
                        key={r.uid}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {r.fullName}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {r.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {p?.kind}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {p?.weeks}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-blue-900 dark:text-teal-500">
                          ₦{Number(p?.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold break-all">
                            {p?.reference}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(String(p?.reference || ""))
                            }
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 hover:underline"
                          >
                            Copy Ref
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BusyButton
                              busy={pendingBusyUid === r.uid}
                              onClick={() => approvePending(r)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:opacity-90 transition"
                              busyText="Reconciling..."
                            >
                              Admin Override
                            </BusyButton>
                            <BusyButton
                              busy={pendingBusyUid === r.uid}
                              onClick={() => clearPending(r.uid)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-orange-600 text-white hover:opacity-90 transition"
                              busyText="Clearing..."
                            >
                              Clear
                            </BusyButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}

          <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Verified Gateway Records
                </h3>
                <p className={sectionCopyClass}>
                  Recent successful Paystack verifications from the Cloud
                  Function, including charged amount, base access amount,
                  and returned gateway fee.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchPaymentRecords}
                className={subtleActionClass}
              >
                {paymentRecordsLoading ? "Loading..." : "Refresh Records"}
              </button>
            </div>

            {paymentRecordsError ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
                {paymentRecordsError}
              </div>
            ) : paymentRecordsLoading ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
                Loading verified payment records...
              </div>
            ) : paymentRecords.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
                No verified gateway records yet. Successful Paystack
                confirmations will appear here after the verification
                function completes.
              </div>
            ) : (
              <>
              <div className="space-y-3 lg:hidden">
                {paymentRecords.map((payment) => {
                  const student =
                    registrationsByUid.get(payment.userId) || null;
                  const reference = String(
                    payment.reference || payment.id || "",
                  );
                  const status = String(
                    payment.paystack?.status || "success",
                  );
                  const channel = String(
                    payment.paystack?.channel || "paystack",
                  );

                  return (
                    <div
                      key={`${payment.userId}-${payment.id}-mobile`}
                      className={adminMobileRecordClass}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900 dark:text-white">
                            {student?.fullName || payment.email || "Student"}
                          </p>
                          <p className="mt-1 break-all text-xs font-medium text-slate-500 dark:text-slate-400">
                            {student?.email || payment.email || payment.userId}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                          {status}
                        </span>
                      </div>

                      {(payment.path || student?.path) && (
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {payment.path || student?.path}
                        </p>
                      )}

                      <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
                        <p className={adminFieldLabelClass}>Reference</p>
                        <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                          {reference || "—"}
                        </p>
                        {reference && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(reference)}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:underline dark:text-blue-400"
                          >
                            Copy Ref
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <p className={adminFieldLabelClass}>Payment</p>
                          <p className={adminFieldValueClass}>
                            {payment.kind || "payment"} ·{" "}
                            {Number(payment.weeks || 0) || "—"} week(s)
                          </p>
                        </div>
                        <div>
                          <p className={adminFieldLabelClass}>Gateway</p>
                          <p className={adminFieldValueClass}>{channel}</p>
                        </div>
                        <div>
                          <p className={adminFieldLabelClass}>Charged</p>
                          <p className={adminFieldValueClass}>
                            {formatPaymentAmount(
                              payment.chargedAmountKobo ??
                                payment.amountKobo,
                              payment.amount,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className={adminFieldLabelClass}>Base</p>
                          <p className={adminFieldValueClass}>
                            {formatPaymentAmount(
                              payment.baseAmountKobo,
                              payment.amount,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className={adminFieldLabelClass}>Gateway Fee</p>
                          <p className={adminFieldValueClass}>
                            {formatPaymentAmount(payment.gatewayFeeKobo)}
                          </p>
                        </div>
                        <div>
                          <p className={adminFieldLabelClass}>Verified</p>
                          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {formatPaymentDate(
                              payment.verifiedAt ||
                                payment.paystack?.paidAt ||
                                payment.timestamp,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Student
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Gateway
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Verified
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {paymentRecords.map((payment) => {
                      const student =
                        registrationsByUid.get(payment.userId) || null;
                      const reference = String(
                        payment.reference || payment.id || "",
                      );
                      const status = String(
                        payment.paystack?.status || "success",
                      );
                      const channel = String(
                        payment.paystack?.channel || "paystack",
                      );

                      return (
                        <tr
                          key={`${payment.userId}-${payment.id}`}
                          className="transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-blue-900 dark:text-white">
                              {student?.fullName || payment.email || "Student"}
                            </p>
                            <p className="text-xs font-medium text-slate-400">
                              {student?.email || payment.email || payment.userId}
                            </p>
                            {(payment.path || student?.path) && (
                              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {payment.path || student?.path}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="max-w-[220px] break-all font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                              {reference || "—"}
                            </p>
                            {reference && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(reference)}
                                className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:underline dark:text-blue-400"
                              >
                                Copy Ref
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                              {payment.kind || "payment"} ·{" "}
                              {Number(payment.weeks || 0) || "—"} week(s)
                            </p>
                            <div className="mt-2 space-y-1 text-xs font-bold text-slate-500 dark:text-slate-300">
                              <p>
                                Charged:{" "}
                                <span className="text-slate-900 dark:text-white">
                                  {formatPaymentAmount(
                                    payment.chargedAmountKobo ??
                                      payment.amountKobo,
                                    payment.amount,
                                  )}
                                </span>
                              </p>
                              <p>
                                Base:{" "}
                                <span className="text-slate-900 dark:text-white">
                                  {formatPaymentAmount(
                                    payment.baseAmountKobo,
                                    payment.amount,
                                  )}
                                </span>
                              </p>
                              <p>
                                Gateway fee:{" "}
                                <span className="text-slate-900 dark:text-white">
                                  {formatPaymentAmount(
                                    payment.gatewayFeeKobo,
                                  )}
                                </span>
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                              {status}
                            </span>
                            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                              {channel}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {formatPaymentDate(
                              payment.verifiedAt ||
                                payment.paystack?.paidAt ||
                                payment.timestamp,
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentsSection;
