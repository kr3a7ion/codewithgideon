import React from "react";
import { cn } from "./cn";

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div
    className={cn(
      "flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40",
      className,
    )}
  >
    {icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm dark:bg-slate-800 dark:text-teal-300">
        {icon}
      </div>
    ) : null}
    <p className="font-display text-lg font-bold text-blue-900 dark:text-white">{title}</p>
    {description ? (
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);
