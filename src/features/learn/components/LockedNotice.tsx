import React from "react";
import { Lock } from "lucide-react";
import { Button } from "../../../ui";
import { useStudent } from "../StudentDataContext";

/** Shown in place of paid content until the first payment is confirmed. */
export const LockedNotice: React.FC<{ title: string; body: string }> = ({ title, body }) => {
  const { continuePayment } = useStudent();
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-500/20 dark:bg-orange-500/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 dark:bg-slate-900 dark:text-orange-300">
          <Lock className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-display font-bold text-orange-900 dark:text-orange-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-orange-900/80 dark:text-orange-100/80">{body}</p>
        </div>
      </div>
      <Button variant="accent" onClick={continuePayment} className="shrink-0">
        Complete payment
      </Button>
    </div>
  );
};
