import React from "react";

/** Full-section loading state used while routes or auth load. */
export const LoadingPanel: React.FC<{ label?: string; hint?: string }> = ({
  label = "Loading",
  hint = "Preparing this section for you.",
}) => (
  <div className="min-h-[55vh] px-6 py-20" role="status" aria-live="polite">
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-2xl border-4 border-slate-200 border-t-blue-900 dark:border-slate-700 dark:border-t-teal-400" />
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-900 dark:text-teal-300">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  </div>
);
