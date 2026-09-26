import React from "react";
import { cn } from "./cn";

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-hidden
    className={cn("animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800", className)}
  />
);
