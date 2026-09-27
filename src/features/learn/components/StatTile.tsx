import React from "react";
import { Skeleton } from "../../../ui";

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ label, value, hint, icon, loading }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <span className="text-teal-600 dark:text-teal-300" aria-hidden>
        {icon}
      </span>
    </div>
    {loading ? (
      <Skeleton className="mt-3 h-8 w-20" />
    ) : (
      <p className="mt-2 font-display text-2xl font-bold text-blue-900 dark:text-white">{value}</p>
    )}
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
  </div>
);
