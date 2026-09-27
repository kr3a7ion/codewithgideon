import React from "react";
import { cn } from "./cn";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export const Field: React.FC<{
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, hint, error, children, className }) => (
  <div className={cn("space-y-1.5", className)}>
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
    >
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
    ) : hint ? (
      <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    ) : null}
  </div>
);
