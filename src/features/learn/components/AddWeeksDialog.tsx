import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { mbtn } from "../../../marketing/ui";
import { Dialog } from "../../shared/Dialog";
import { naira, plural } from "../../shared/ui";
import { WeeksPicker } from "../../join/ui";

/** Choose how many more weeks to unlock, then go to Paystack. */
export const AddWeeksDialog: React.FC<{
  open: boolean;
  paidWeeks: number;
  totalWeeks: number;
  weeklyRate: number;
  onClose: () => void;
  onPay: (weeks: number) => void;
}> = ({ open, paidWeeks, totalWeeks, weeklyRate, onClose, onPay }) => {
  const remaining = Math.max(0, totalWeeks - paidWeeks);
  const [weeks, setWeeks] = useState(1);

  useEffect(() => {
    if (open) setWeeks(Math.max(1, Math.min(2, remaining)));
  }, [open, remaining]);

  const total = weeks * weeklyRate;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add weeks"
      description={`You've unlocked ${paidWeeks} of ${totalWeeks} weeks. Choose how many more to add.`}
    >
      <div className="space-y-5">
        <WeeksPicker value={weeks} max={remaining} onChange={setWeeks} startWeek={paidWeeks + 1} totalWeeks={totalWeeks} quickPicks={[1, 2, remaining]} />
        <dl className="space-y-2.5 rounded-2xl bg-paper px-4 py-4 text-sm dark:bg-slate-800">
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-slate-600 dark:text-slate-300">
              {plural(weeks, "week")} × {naira(weeklyRate)}
            </dt>
            <dd className="font-semibold text-blue-900 dark:text-white">{naira(total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-slate-600 dark:text-slate-300">Paystack fee</dt>
            <dd className="font-medium text-slate-500 dark:text-slate-400">Shown at checkout</dd>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <dt className="text-[15px] font-bold text-blue-900 dark:text-white">Due today</dt>
            <dd className="font-display text-2xl font-bold text-blue-900 dark:text-white">{naira(total)}</dd>
          </div>
        </dl>
        <button type="button" onClick={() => onPay(weeks)} disabled={remaining <= 0 || weeklyRate <= 0} className={mbtn({ kind: "learn", size: "lg", full: true })}>
          Pay {naira(total)} <Lock className="h-[18px] w-[18px]" aria-hidden />
        </button>
        <p className="text-center text-[13px] font-medium text-slate-500 dark:text-slate-400">Your new weeks unlock as soon as the payment is confirmed.</p>
      </div>
    </Dialog>
  );
};
