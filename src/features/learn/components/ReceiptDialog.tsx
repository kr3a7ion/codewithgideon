import React, { useEffect } from "react";
import { Printer } from "lucide-react";
import { Lockup, mbtn } from "../../../marketing/ui";
import { Dialog } from "../../shared/Dialog";
import { naira } from "../../shared/ui";
import { dateLabel } from "../time";
import { channelLabel, type PaymentRecord } from "../usePayments";

export const statusLabel = (status: string) =>
  status === "success" ? "Paid" : status === "needs_review" ? "Being confirmed" : status === "reviewed" ? "Checked by Gideon" : status || "Unknown";

/** A printable receipt for one payment. "Print" also saves as PDF. */
export const ReceiptDialog: React.FC<{
  payment: PaymentRecord | null;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  what: string;
}> = ({ payment, onClose, studentName, studentEmail, courseTitle, what }) => {
  // Lets the print styles print only the receipt while it's open.
  useEffect(() => {
    if (!payment) return;
    document.body.classList.add("receipt-open");
    return () => document.body.classList.remove("receipt-open");
  }, [payment]);
  if (!payment) return null;
  const charged = payment.amountKobo / 100;
  const base = payment.baseAmount || charged;
  const fee = Math.max(0, charged - base);
  const rows: [string, React.ReactNode][] = [
    ["Receipt number", <span className="font-mono text-[13px]">{payment.reference}</span>],
    ["Date", payment.paidAtMs ? dateLabel(payment.paidAtMs) : "—"],
    ["Student", <>{studentName || "—"}<span className="block text-[13px] font-medium text-slate-500 dark:text-slate-400">{payment.email || studentEmail}</span></>],
    ["Course", courseTitle || payment.path || "—"],
    ...(payment.cohortLabel ? ([["Cohort", payment.cohortLabel]] as [string, React.ReactNode][]) : []),
    ["For", what],
    ["Method", `${channelLabel(payment.channel)} via Paystack`],
    ["Status", statusLabel(payment.status)],
  ];
  return (
    <Dialog open={!!payment} onClose={onClose} title="Receipt" size="md" className="print-area student-app">
      <div className="space-y-5">
        <div className="hidden items-center justify-between print:flex">
          <Lockup className="h-8" />
          <p className="text-sm font-semibold text-slate-500">codewithgideon.com</p>
        </div>
        <div className="rounded-2xl bg-paper px-5 py-4 dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total paid</p>
          <p className="font-display text-[32px] font-bold leading-10 text-blue-900 dark:text-white">{naira(charged)}</p>
        </div>
        <dl className="divide-y divide-line text-[15px] dark:divide-line-dark">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 py-2.5">
              <dt className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="min-w-0 break-words text-right font-semibold text-blue-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <dl className="space-y-2 rounded-2xl border border-line px-5 py-4 text-[15px] dark:border-line-dark">
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-600 dark:text-slate-300">Course amount</dt>
            <dd className="font-semibold text-blue-900 dark:text-white">{naira(base)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-600 dark:text-slate-300">Paystack fee</dt>
            <dd className="font-semibold text-blue-900 dark:text-white">{naira(fee)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 dark:border-line-dark">
            <dt className="font-bold text-blue-900 dark:text-white">Total paid</dt>
            <dd className="font-bold text-blue-900 dark:text-white">{naira(charged)}</dd>
          </div>
        </dl>
        <div className="no-print flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={mbtn({ kind: "secondary" })}>
            Close
          </button>
          <button type="button" onClick={() => window.print()} className={mbtn({ kind: "learn" })}>
            <Printer className="h-[18px] w-[18px]" aria-hidden /> Print or save as PDF
          </button>
        </div>
      </div>
    </Dialog>
  );
};
