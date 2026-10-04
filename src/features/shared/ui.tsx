/**
 * Small building blocks shared by the join flow and the student area.
 * Figma: "07 Student UI" in the rebrand file. Buttons and tags come from
 * src/marketing/ui (mbtn, Tag) so the student pages match the public site.
 */
import React from "react";
import { AlertCircle, CheckCircle2, Clock3, Info, type LucideIcon } from "lucide-react";
import { cn } from "../../ui";

export const Spinner: React.FC<{ className?: string; label?: string }> = ({ className, label }) => (
  <span
    role={label ? "status" : undefined}
    aria-label={label}
    className={cn("inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
  />
);

/** White card with the warm hairline border used across the student pages. */
export const Card: React.FC<{
  as?: "div" | "section" | "article" | "li" | "aside";
  className?: string;
  children: React.ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}> = ({ as: Tag = "div", className, children, ...rest }) => (
  <Tag
    className={cn(
      "rounded-[20px] border border-line bg-white dark:border-line-dark dark:bg-slate-900",
      className,
    )}
    {...rest}
  >
    {children}
  </Tag>
);

const tileTones = {
  learn: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  paper: "bg-paper text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  hire: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  navy: "bg-blue-900 text-white dark:bg-white dark:text-blue-900",
};

/** Rounded square holding an icon. */
export const IconTile: React.FC<{
  icon: LucideIcon;
  tone?: keyof typeof tileTones;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ icon: Icon, tone = "learn", size = "md", className }) => (
  <span
    aria-hidden
    className={cn(
      "flex shrink-0 items-center justify-center",
      size === "sm" ? "h-9 w-9 rounded-[10px]" : size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-xl",
      tileTones[tone],
      className,
    )}
  >
    <Icon className={size === "lg" ? "h-7 w-7" : size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} />
  </span>
);

export const initialsOf = (name: string) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";

/** Navy circle with the student's initials. */
export const Avatar: React.FC<{ name: string; size?: number; className?: string; tone?: "navy" | "teal" }> = ({
  name,
  size = 40,
  className,
  tone = "navy",
}) => (
  <span
    aria-hidden
    style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
      tone === "teal" ? "bg-teal-600 text-white" : "bg-blue-900 text-white dark:bg-teal-500 dark:text-blue-950",
      className,
    )}
  >
    {initialsOf(name)}
  </span>
);

/** Thin rounded progress bar. */
export const Progress: React.FC<{ value: number; max: number; label: string; className?: string; size?: "sm" | "md" }> = ({
  value,
  max,
  label,
  className,
  size = "sm",
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("w-full overflow-hidden rounded-full bg-paper dark:bg-slate-800", size === "md" ? "h-2.5" : "h-2", className)}
    >
      <div className="h-full rounded-full bg-teal-600 transition-[width] duration-500 dark:bg-teal-400" style={{ width: `${pct}%` }} />
    </div>
  );
};

const noticeTones = {
  pending: {
    box: "bg-orange-50 dark:bg-orange-950/40",
    icon: AlertCircle,
    iconCls: "text-orange-700 dark:text-orange-300",
  },
  review: {
    box: "border border-line bg-paper dark:border-line-dark dark:bg-paper-dark",
    icon: Clock3,
    iconCls: "text-blue-900 dark:text-white",
  },
  success: {
    box: "bg-teal-50 dark:bg-teal-950/50",
    icon: CheckCircle2,
    iconCls: "text-teal-700 dark:text-teal-300",
  },
  info: {
    box: "border border-line bg-white dark:border-line-dark dark:bg-slate-900",
    icon: Info,
    iconCls: "text-slate-500 dark:text-slate-300",
  },
  error: {
    box: "border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
    icon: AlertCircle,
    iconCls: "text-red-700 dark:text-red-300",
  },
};

/**
 * A highlighted message with an optional action. Used for payment states,
 * form errors and confirmations.
 */
export const Notice: React.FC<{
  tone: keyof typeof noticeTones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  role?: "status" | "alert";
  id?: string;
  tabIndex?: number;
}> = ({ tone, title, children, action, icon, className, role, id, tabIndex }) => {
  const t = noticeTones[tone];
  const Icon = icon || t.icon;
  return (
    <div
      id={id}
      tabIndex={tabIndex}
      role={role || (tone === "error" ? "alert" : undefined)}
      className={cn(
        "flex flex-col gap-3 rounded-2xl px-4 py-4 outline-none sm:flex-row sm:items-center sm:gap-4 sm:px-5",
        t.box,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", t.iconCls)} aria-hidden />
        <div className="min-w-0">
          {title ? <p className="text-[15px] font-bold leading-5 text-blue-900 dark:text-white">{title}</p> : null}
          {children ? (
            <div className={cn("text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300", title && "mt-0.5")}>{children}</div>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2 pl-8 sm:pl-0">{action}</div> : null}
    </div>
  );
};

/** Small uppercase label above a group. */
export const GroupLabel: React.FC<{ children: React.ReactNode; className?: string; as?: "h2" | "h3" | "p" }> = ({
  children,
  className,
  as: Tag = "h3",
}) => (
  <Tag className={cn("font-sans text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400", className)}>
    {children}
  </Tag>
);

/** Naira with thousands separators. */
export const naira = (n: number) => `₦${Math.max(0, Math.round(Number(n) || 0)).toLocaleString("en-NG")}`;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
