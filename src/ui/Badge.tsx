import React from "react";
import { cn } from "./cn";

type Tone = "navy" | "teal" | "orange" | "slate" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  navy: "bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60",
  teal: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
  orange: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
  slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  warning: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20",
  danger: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
};

export const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; icon?: React.ReactNode }
> = ({ tone = "navy", icon, className, children, ...rest }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
      tones[tone],
      className,
    )}
    {...rest}
  >
    {icon}
    {children}
  </span>
);
