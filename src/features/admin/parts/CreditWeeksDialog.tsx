/* Give a student paid weeks (cash, transfer, a Paystack payment that needs
   review, or free) and place them in a cohort so they see their classes. */
import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { registrationStore, type RegistrationEntry } from "../../../../services/registrationStore";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, naira } from "../ui";

export type CreditPreset = {
  weeks?: number;
  amount?: number;
  method?: Method;
  reference?: string;
  /** Settle a Paystack payment flagged "needs review" instead of adding a new record. */
  resolveExisting?: boolean;
  context?: React.ReactNode;
};

type Method = "transfer" | "cash" | "paystack" | "free";

const METHODS: { value: Method; label: string }[] = [
  { value: "transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "paystack", label: "Paystack" },
  { value: "free", label: "Free" },
];

export const CreditWeeksDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  reg: RegistrationEntry | null;
  preset?: CreditPreset;
  onDone?: () => void;
}> = ({ open, onClose, reg, preset, onDone }) => {
  const { courses, cohorts, activeByPath, fetchRegistrations, fetchPaymentRecords, fetchStudentPayments, notify } = useAdmin();
  const r: any = reg || {};

  const course: any = useMemo(
    () =>
      courses.find((c: any) => c.id === r.courseId) ||
      courses.find((c: any) => c.pathId && c.pathId === r.pathId && c.isActive !== false) ||
      null,
    [courses, r.courseId, r.pathId],
  );
  const maxWeeks = Number(course?.weeks || r.courseDurationWeeks || 0);
  const rate = Number(course?.pricePerWeek || r.weeklyRate || 0);
  const enrolled = r.status === "Complete";
  const paidWeeks = enrolled ? Number(r.weeksToCommit || 0) : 0;
  const left = maxWeeks ? Math.max(0, maxWeeks - paidWeeks) : 52;

  const pathCohorts = useMemo(
    () =>
      [...cohorts]
        .filter((c: any) => !r.pathId || !c.pathId || c.pathId === r.pathId)
        .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [cohorts, r.pathId],
  );
  const intake: any = activeByPath?.[r.pathId] || null;
  const defaultCohort = String(r.cohortKey || intake?.cohortKey || pathCohorts[0]?.cohortKey || pathCohorts[0]?.id || "");

  const [weeks, setWeeks] = useState(1);
  const [method, setMethod] = useState<Method>("transfer");
  const [amount, setAmount] = useState(0);
  const [amountTouched, setAmountTouched] = useState(false);
  const [cohortKey, setCohortKey] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const w = Math.max(1, Math.min(left || 1, Math.floor(preset?.weeks || (enrolled ? 1 : Math.min(4, left || 1)))));
    setWeeks(w);
    setMethod(preset?.method || "transfer");
    setAmount(preset?.amount ?? w * rate);
    setAmountTouched(preset?.amount != null);
    setCohortKey(defaultCohort);
    setNote("");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reg?.uid]);

  const changeWeeks = (n: number) => {
    const w = Math.max(1, Math.min(left || 1, Math.floor(n) || 1));
    setWeeks(w);
    if (!amountTouched) setAmount(w * rate);
  };

  const cohortOptions = useMemo(() => {
    const list = pathCohorts.map((c: any) => ({ key: String(c.cohortKey || c.id), id: String(c.cohortId || c.cohortKey || c.id), label: String(c.label || c.id) }));
    if (r.cohortKey && !list.some((c) => c.key === r.cohortKey)) {
      list.unshift({ key: r.cohortKey, id: String(r.cohortId || r.cohortKey), label: String(r.cohortLabel || r.cohortKey) });
    }
    return list;
  }, [pathCohorts, r.cohortKey, r.cohortId, r.cohortLabel]);
  const chosen = cohortOptions.find((c) => c.key === cohortKey) || null;
  const resolving = !!preset?.resolveExisting;
  const free = method === "free";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg) return;
    setError("");
    if (!chosen) {
      setError("Choose a cohort so the student can see their classes. Start an intake on the Cohorts page if there isn't one.");
      return;
    }
    setSaving(true);
    try {
      const result = await registrationStore.creditWeeks(reg.uid, {
        weeks,
        amount: free ? 0 : amount,
        method,
        reference: preset?.reference,
        resolveExisting: resolving,
        cohort: { cohortId: chosen.id, cohortKey: chosen.key, label: chosen.label },
        note,
      });
      await Promise.all([fetchRegistrations(), fetchPaymentRecords(), fetchStudentPayments(reg.uid)]);
      notify(
        "success",
        `${reg.fullName || "Student"} now has ${result.weeks}${result.maxWeeks ? ` of ${result.maxWeeks}` : ""} weeks${result.cohortLabel ? ` in ${result.cohortLabel}` : ""}.`,
      );
      onDone?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't add the weeks. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const after = paidWeeks + weeks;

  return (
    <Dialog
      open={open && !!reg}
      onClose={onClose}
      title={enrolled ? "Add weeks" : "Confirm payment"}
      description={reg ? `${reg.fullName} · ${reg.path || "No course"}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="credit-form" loading={saving} disabled={left < 1}>
            {left < 1 ? "Course fully paid" : `Add ${weeks} week${weeks === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <form id="credit-form" onSubmit={submit} className="space-y-5">
        {preset?.context ? (
          <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">{preset.context}</div>
        ) : null}

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Paid now", maxWeeks ? `${paidWeeks} / ${maxWeeks}` : String(paidWeeks)],
            ["Weekly price", rate ? naira(rate) : "Not set"],
            ["Cohort", r.cohortLabel || "Not placed"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-2 py-2.5 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold text-slate-500">{k}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-blue-900 dark:text-white">{v}</p>
            </div>
          ))}
        </div>

        {left < 1 ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            {reg?.fullName} has already paid for every week of this course.
          </p>
        ) : (
          <>
            <Field label="Weeks to add" htmlFor="credit-weeks" hint={maxWeeks ? `${left} week${left === 1 ? "" : "s"} left in the course.` : undefined}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700">
                  <button type="button" aria-label="One week fewer" onClick={() => changeWeeks(weeks - 1)} disabled={weeks <= 1} className="flex h-11 w-11 items-center justify-center text-slate-600 disabled:opacity-40 dark:text-slate-300">
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <input
                    id="credit-weeks"
                    type="number"
                    min={1}
                    max={left}
                    value={weeks}
                    onChange={(e) => changeWeeks(Number(e.target.value))}
                    className="h-11 w-14 border-x border-slate-200 bg-transparent text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-base font-bold text-blue-900 outline-none dark:border-slate-700 dark:text-white"
                  />
                  <button type="button" aria-label="One more week" onClick={() => changeWeeks(weeks + 1)} disabled={weeks >= left} className="flex h-11 w-11 items-center justify-center text-slate-600 disabled:opacity-40 dark:text-slate-300">
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {[...new Set([1, 4, left].filter((n) => n >= 1 && n <= left))].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => changeWeeks(n)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      weeks === n
                        ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300",
                    )}
                  >
                    {n === left && maxWeeks ? `Rest of course (${n})` : `${n} wk${n === 1 ? "" : "s"}`}
                  </button>
                ))}
              </div>
            </Field>

            {resolving ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This settles the Paystack payment{preset?.amount ? ` of ${naira(preset.amount)}` : ""}. It stays in their history as one payment.
              </p>
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">How they paid</p>
                  <div role="radiogroup" aria-label="How they paid" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={method === m.value}
                        onClick={() => setMethod(m.value)}
                        className={cn(
                          "h-10 rounded-xl border text-sm font-semibold transition",
                          method === m.value
                            ? "border-blue-900 bg-blue-900 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {!free ? (
                  <Field label="Amount received (₦)" htmlFor="credit-amount" hint={rate ? `Course price for ${weeks} week${weeks === 1 ? "" : "s"}: ${naira(weeks * rate)}` : undefined}>
                    <input
                      id="credit-amount"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={amount || ""}
                      onChange={(e) => {
                        setAmount(Number(e.target.value));
                        setAmountTouched(true);
                      }}
                      className={inputClass}
                    />
                  </Field>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No money is recorded. Use this for scholarships or make-up weeks.</p>
                )}
              </>
            )}

            <Field label="Cohort" htmlFor="credit-cohort" hint="The student sees this cohort's classes and group.">
              {cohortOptions.length ? (
                <select id="credit-cohort" value={cohortKey} onChange={(e) => setCohortKey(e.target.value)} className={inputClass}>
                  {cohortOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                      {c.key === r.cohortKey ? " (current)" : c.key === intake?.cohortKey ? " (open intake)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  This course has no cohort yet. Start an intake on the Cohorts page first.
                </p>
              )}
            </Field>

            {!resolving ? (
              <Field label="Note (optional)" htmlFor="credit-note" hint="Only admins see this, e.g. a transfer reference.">
                <input id="credit-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={inputClass} />
              </Field>
            ) : null}

            <p className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              After this, {reg?.fullName?.split(" ")[0] || "they"} will have{" "}
              <strong>{maxWeeks ? `${after} of ${maxWeeks}` : after} weeks</strong>
              {chosen ? <> in <strong>{chosen.label}</strong></> : null} and can join those classes straight away.
            </p>
          </>
        )}

        {error ? (
          <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </form>
    </Dialog>
  );
};
