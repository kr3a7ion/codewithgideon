import React from "react";
import { cn } from "./cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  interactive?: boolean;
};

export const Card: React.FC<CardProps> = ({
  padded = true,
  interactive = false,
  className,
  ...rest
}) => (
  <div
    className={cn(
      "rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900",
      padded && "p-6 sm:p-8",
      interactive &&
        "transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg dark:hover:border-teal-700",
      className,
    )}
    {...rest}
  />
);
