import React from "react";
import { cn } from "./cn";

export const PageHeader: React.FC<{
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** Heading level; use 2 inside a page that already has an h1. */
  level?: 1 | 2;
}> = ({ eyebrow, title, description, actions, className, level = 1 }) => {
  const Heading = level === 1 ? "h1" : "h2";
  return (
  <div
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
      className,
    )}
  >
    <div className="min-w-0">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={
          level === 1
            ? "mt-2 text-3xl font-bold text-blue-900 dark:text-white sm:text-4xl"
            : "mt-2 text-2xl font-bold text-blue-900 dark:text-white sm:text-3xl"
        }
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
  </div>
  );
};
