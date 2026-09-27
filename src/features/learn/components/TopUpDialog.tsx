import React, { useEffect, useRef, useState } from "react";
import { CreditCard, X } from "lucide-react";
import { Button, inputClass } from "../../../ui";
import { formatNaira } from "../lib";

/** Accessible dialog to choose how many more weeks to pay for. */
export const TopUpDialog: React.FC<{
  open: boolean;
  remainingWeeks: number;
  weeklyRate: number;
  onClose: () => void;
  onContinue: (weeks: number) => void;
}> = ({ open, remainingWeeks, weeklyRate, onClose, onContinue }) => {
  const [weeks, setWeeks] = useState(1);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!open) return;
    setWeeks(Math.min(1, remainingWeeks) || 1);
    const t = window.setTimeout(() => selectRef.current?.focus(), 20);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, remainingWeeks, onClose]);

  if (!open) return null;

  const options = Array.from({ length: Math.max(0, remainingWeeks) }, (_, i) => i + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-title"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-teal-500/10 dark:text-teal-300">
            <CreditCard className="h-5 w-5" aria-hidden />
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="topup-title" className="mt-4 text-xl font-bold text-blue-900 dark:text-white">
          Add more weeks
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          You have {remainingWeeks} week{remainingWeeks === 1 ? "" : "s"} left in this course.
        </p>

        <label htmlFor="topup-weeks" className="mt-6 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Weeks to add
        </label>
        <select
          id="topup-weeks"
          ref={selectRef}
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          className={`${inputClass} mt-1.5`}
        >
          {options.map((w) => (
            <option key={w} value={w}>
              {w} week{w === 1 ? "" : "s"} · {formatNaira(w * weeklyRate)}
            </option>
          ))}
        </select>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total</span>
          <span className="font-display text-xl font-bold text-blue-900 dark:text-white">
            {formatNaira(weeks * weeklyRate)}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Paystack may add a small gateway fee at checkout.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onContinue(weeks)}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
