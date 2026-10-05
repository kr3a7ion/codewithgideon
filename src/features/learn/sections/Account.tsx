import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, LogOut, Moon, Plus, ReceiptText, Sun } from "lucide-react";
import { mbtn, Tag } from "../../../marketing/ui";
import { cn } from "../../../ui";
import { Avatar, Card, Notice, naira, plural, Progress, Spinner } from "../../shared/ui";
import { TextField } from "../../join/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { ReceiptDialog, statusLabel } from "../components/ReceiptDialog";
import { channelLabel, type PaymentRecord } from "../usePayments";
import { dateLabel } from "../time";
import { toMs } from "../lib";

const range = (from: number, to: number) => (from >= to ? `week ${to}` : `weeks ${from} to ${to}`);

/** "2 weeks · weeks 3 to 4" for each paid payment, oldest first. */
const describePayments = (payments: PaymentRecord[]) => {
  const map = new Map<string, string>();
  let total = 0;
  [...payments]
    .sort((a, b) => a.paidAtMs - b.paidAtMs)
    .forEach((p) => {
      if (p.status === "success" && p.weeks > 0) {
        const from = p.kind === "initial" ? 1 : total + 1;
        const to = p.kind === "initial" ? p.weeks : total + p.weeks;
        total = to;
        map.set(p.id, `${plural(p.weeks, "week")} · ${range(from, to)}`);
      } else {
        const w = p.weeks || p.requestedWeeks;
        map.set(p.id, w ? plural(w, "week") : p.kind === "topup" ? "Added weeks" : "First payment");
      }
    });
  return map;
};

const StatTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-paper px-3 py-3 dark:bg-slate-800 sm:px-4">
    <p className="text-xs font-medium leading-4 text-slate-500 dark:text-slate-400 sm:text-[13px]">{label}</p>
    <p className="mt-1 font-display text-base font-bold text-blue-900 dark:text-white sm:text-lg">{value}</p>
  </div>
);

const statusTag = (status: string) =>
  status === "success" ? <Tag tone="learn">Paid</Tag> : status === "needs_review" ? <Tag tone="hire">Being confirmed</Tag> : <Tag tone="neutral">{statusLabel(status)}</Tag>;

/** Payments & account (/student/account): weeks, receipts and profile. */
const Account: React.FC = () => {
  const s = useStudent();
  const profile = s.profile!;
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);
  const [form, setForm] = useState({ fullName: profile.fullName || "", phone: profile.phone || "" });
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"" | "ok" | string>("");

  // Pick up changes made elsewhere (e.g. the app) while nothing is being edited.
  useEffect(() => {
    if (!saving) setForm({ fullName: profile.fullName || "", phone: profile.phone || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.fullName, profile.phone]);

  const descriptions = useMemo(() => describePayments(s.payments), [s.payments]);
  const dirty = form.fullName.trim() !== String(profile.fullName || "").trim() || form.phone.replace(/\D/g, "") !== String(profile.phone || "").replace(/\D/g, "");
  const since = toMs((profile as any).timestamp) || toMs((profile as any).createdAt);
  const state = s.paymentState;
  const remaining = s.remainingWeeks;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved("");
    const next: typeof errors = {};
    const name = form.fullName.trim();
    if (name.length < 3 || !name.includes(" ")) next.fullName = "Enter your first and last name.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) next.phone = "Enter a WhatsApp number like 0803 000 0000.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await s.updateProfileDetails({ fullName: name, phone: digits });
      setSaved("ok");
    } catch (err: any) {
      console.error("profile update failed:", err);
      setSaved(String(err?.message || "") || "We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader title="Payments & account" description="Your weeks, receipts and profile." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
        <div className="space-y-5 lg:space-y-6">
          {/* Weeks */}
          <Card as="section" aria-labelledby="account-course" className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="account-course" className="font-display text-xl font-semibold leading-7 text-blue-900 dark:text-white">
                  {s.courseTitle || "Your course"}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {[s.cohortLabel, s.weeklyRate ? `${naira(s.weeklyRate)} a week` : ""].filter(Boolean).join(" · ")}
                </p>
              </div>
              {state === "active" ? <Tag tone="learn">{remaining ? "Active" : "Full course"}</Tag> : state === "pending" ? <Tag tone="hire">Payment pending</Tag> : <Tag tone="neutral">Checking payment</Tag>}
            </div>
            <div className="space-y-3">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white">
                  {s.paidWeeks} of {plural(s.totalProgramWeeks, "week")}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">unlocked</span>
              </p>
              <Progress value={s.paidWeeks} max={s.totalProgramWeeks} label="Weeks unlocked" size="md" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatTile label="Paid so far" value={naira(s.paidSoFar)} />
              <StatTile label="To finish the course" value={naira(remaining * s.weeklyRate)} />
              <StatTile label="Weeks left" value={String(remaining)} />
            </div>
            {state === "active" && s.canTopUp && !s.topUpInReview ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button type="button" onClick={s.openTopUp} className={mbtn({ kind: "learn", size: "lg" })}>
                  Add weeks <Plus className="h-5 w-5" aria-hidden />
                </button>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pay for as many weeks as you like, whenever you're ready.</p>
              </div>
            ) : state === "pending" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn", size: "lg" })}>
                  {s.weeklyRate ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
                </button>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">For the {plural(s.intendedWeeks, "week")} you chose.</p>
              </div>
            ) : s.reviewPayment ? (
              <Notice tone="review" role="status" title="We're confirming a payment">
                Paystack received {naira(s.reviewPayment.amountKobo / 100)}. You don't need to pay again.
              </Notice>
            ) : null}
          </Card>

          {/* History */}
          <Card as="section" aria-labelledby="account-history" className="overflow-hidden">
            <h2 id="account-history" className="px-5 pb-3 pt-5 font-display text-lg font-semibold text-blue-900 dark:text-white sm:px-6">
              Payment history
            </h2>
            {s.paymentsLoading ? (
              <div className="flex justify-center px-5 py-8">
                <Spinner label="Loading payments" className="text-teal-600" />
              </div>
            ) : s.paymentsError ? (
              <div className="px-5 pb-5 sm:px-6">
                <Notice tone="error">{s.paymentsError}</Notice>
              </div>
            ) : !s.payments.length ? (
              <p className="px-5 pb-6 text-sm font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                No payments yet. Your receipts will show here after you pay.
              </p>
            ) : (
              <>
                {/* Table on wider screens */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-y border-line bg-paper/60 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:border-line-dark dark:bg-slate-800/50 dark:text-slate-400">
                        <th scope="col" className="px-6 py-2.5">Date</th>
                        <th scope="col" className="px-3 py-2.5">What</th>
                        <th scope="col" className="px-3 py-2.5">Method</th>
                        <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                        <th scope="col" className="px-3 py-2.5">Status</th>
                        <th scope="col" className="px-6 py-2.5">
                          <span className="sr-only">Receipt</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-line-dark">
                      {s.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-600 dark:text-slate-300">{p.paidAtMs ? dateLabel(p.paidAtMs) : "—"}</td>
                          <td className="px-3 py-3.5 font-bold text-blue-900 dark:text-white">{descriptions.get(p.id)}</td>
                          <td className="whitespace-nowrap px-3 py-3.5 font-medium text-slate-600 dark:text-slate-300">{channelLabel(p.channel)}</td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right font-bold text-blue-900 dark:text-white">{naira(p.baseAmount || p.amountKobo / 100)}</td>
                          <td className="whitespace-nowrap px-3 py-3.5">{statusTag(p.status)}</td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-right">
                            <button type="button" onClick={() => setReceipt(p)} className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:underline dark:text-teal-300">
                              <ReceiptText className="h-4 w-4" aria-hidden /> Receipt
                              <span className="sr-only"> for {p.paidAtMs ? dateLabel(p.paidAtMs) : p.reference}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* List on phones */}
                <ul className="divide-y divide-line border-t border-line dark:divide-line-dark dark:border-line-dark sm:hidden">
                  {s.payments.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => setReceipt(p)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-blue-900 dark:text-white">{descriptions.get(p.id)}</span>
                          <span className="mt-0.5 block text-[13px] font-medium text-slate-500 dark:text-slate-400">
                            {[p.paidAtMs ? dateLabel(p.paidAtMs) : "", channelLabel(p.channel)].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[15px] font-bold text-blue-900 dark:text-white">{naira(p.baseAmount || p.amountKobo / 100)}</span>
                          {statusTag(p.status)}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-line px-5 py-3 text-[13px] font-medium text-slate-500 dark:border-line-dark dark:text-slate-400 sm:px-6">
                  Amounts are what you paid for your weeks. Paystack's fee is shown on each receipt.
                </p>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <Card as="section" aria-labelledby="account-profile" className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Avatar name={profile.fullName} size={48} />
              <div className="min-w-0">
                <h2 id="account-profile" className="truncate font-display text-lg font-semibold text-blue-900 dark:text-white">
                  {profile.fullName || "Your profile"}
                </h2>
                {since ? <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Student since {dateLabel(since)}</p> : null}
              </div>
            </div>
            <form onSubmit={save} noValidate className="mt-5 space-y-4">
              <TextField
                label="Full name"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fullName: e.target.value }));
                  setSaved("");
                }}
                error={errors.fullName}
              />
              <TextField
                label="WhatsApp number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d+\s]/g, "") }));
                  setSaved("");
                }}
                error={errors.phone}
              />
              <div>
                <label htmlFor="account-email" className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
                  Email
                </label>
                <input
                  id="account-email"
                  value={profile.email || ""}
                  readOnly
                  aria-describedby="account-email-help"
                  className="h-[50px] w-full cursor-default rounded-xl border-[1.5px] border-line-strong bg-paper px-4 text-base text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-900/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                />
                <p id="account-email-help" className="mt-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  To change your email, message Gideon.
                </p>
              </div>
              {saved === "ok" ? (
                <Notice tone="success" role="status">
                  Saved.
                </Notice>
              ) : saved ? (
                <Notice tone="error">{saved}</Notice>
              ) : null}
              <button type="submit" disabled={saving || !dirty} className={mbtn({ kind: "secondary", full: true })}>
                {saving ? <Spinner /> : null} Save changes
              </button>
            </form>
          </Card>

          {s.onToggleTheme ? (
            <Card className="p-2">
              <button type="button" role="switch" aria-checked={!!s.isDark} onClick={s.onToggleTheme} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-paper dark:hover:bg-slate-800">
                {s.isDark ? <Moon className="h-5 w-5 text-blue-900 dark:text-white" aria-hidden /> : <Sun className="h-5 w-5 text-blue-900" aria-hidden />}
                <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">Dark mode</span>
                <span className={cn("relative h-6 w-11 rounded-full transition-colors", s.isDark ? "bg-teal-600" : "bg-line-strong")} aria-hidden>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]", s.isDark ? "left-[22px]" : "left-0.5")} />
                </span>
              </button>
            </Card>
          ) : null}

          <Card className="p-2">
            <button type="button" onClick={s.logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-paper dark:hover:bg-slate-800">
              <LogOut className="h-5 w-5 text-blue-900 dark:text-white" aria-hidden />
              <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">Sign out of this device</span>
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
            </button>
          </Card>
        </div>
      </div>

      <ReceiptDialog
        payment={receipt}
        onClose={() => setReceipt(null)}
        studentName={profile.fullName}
        studentEmail={profile.email}
        courseTitle={s.courseTitle}
        what={receipt ? descriptions.get(receipt.id) || "" : ""}
      />
    </div>
  );
};

export default Account;
