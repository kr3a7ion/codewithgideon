/* Building blocks for the admin area (layout-level pieces live in layout/). */
import React, { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import { cn } from "../../ui";

// ---------------------------------------------------------------------------
// Page + panels
// ---------------------------------------------------------------------------

export const AdminPage: React.FC<{
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, actions, children }) => {
  // Runs after the route-level PageMeta effect, so the tab shows the page.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.title = `${title} · Admin | Code with Gideon`;
    }, 0);
    return () => window.clearTimeout(t);
  }, [title]);
  return (
  <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-white sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
    <div className="space-y-5 sm:space-y-6">{children}</div>
  </div>
  );
};

export const Panel: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  id?: string;
}> = ({ title, description, actions, children, className, bodyClassName, padded = true, id }) => (
  <section
    id={id}
    className={cn(
      "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
      className,
    )}
  >
    {title || actions ? (
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          {title ? (
            <h2 className="text-base font-bold text-blue-900 dark:text-white">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    ) : null}
    <div className={cn(padded && "p-4 sm:p-5", bodyClassName)}>{children}</div>
  </section>
);

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "teal" | "orange" | "danger";
  onClick?: () => void;
}> = ({ label, value, hint, tone = "default", onClick }) => {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900",
        onClick && "transition hover:border-teal-300 dark:hover:border-teal-700",
      )}
    >
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold",
          tone === "default" && "text-blue-900 dark:text-white",
          tone === "teal" && "text-teal-600 dark:text-teal-400",
          tone === "orange" && "text-orange-600 dark:text-orange-400",
          tone === "danger" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </Tag>
  );
};

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export type SegmentOption<T extends string> = { value: T; label: string; count?: number };

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              active
                ? "bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-blue-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800",
            )}
          >
            {o.label}
            {typeof o.count === "number" ? (
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1.5 text-center text-[11px] font-bold",
                  active
                    ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "Search", label = "Search", className }) => (
  <label className={cn("relative block", className)}>
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  </label>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </label>
        {description ? <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
          checked ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
};

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; busy?: boolean }
> = ({ label, busy, className, children, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-blue-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
      className,
    )}
    {...rest}
  >
    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : children}
  </button>
);

export const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({
  text,
  label = "Copy",
  className,
}) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800",
        className,
      )}
    >
      {done ? <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? "Copied" : label}
    </button>
  );
};

export const Pill: React.FC<{
  tone?: "slate" | "teal" | "orange" | "danger" | "navy" | "success";
  children: React.ReactNode;
  className?: string;
}> = ({ tone = "slate", children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
      tone === "slate" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      tone === "teal" && "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
      tone === "success" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      tone === "orange" && "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
      tone === "danger" && "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
      tone === "navy" && "bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
      className,
    )}
  >
    {children}
  </span>
);

export const EmptyHint: React.FC<{
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, children, action }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    {icon ? (
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </div>
    ) : null}
    <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
    {children ? <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{children}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const Spinner: React.FC<{ label?: string; className?: string }> = ({ label = "Loading", className }) => (
  <div className={cn("flex items-center justify-center gap-2 py-8 text-sm text-slate-500", className)} role="status">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// Overlays: dialog (centred / bottom sheet), drawer (side / full screen), menu
// ---------------------------------------------------------------------------

const useOverlay = (open: boolean, onClose: () => void) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], input, textarea, select, button:not([data-close])",
      );
      (el || panelRef.current)?.focus();
    }, 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return panelRef;
};

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}> = ({ open, onClose, title, description, children, footer, size = "md" }) => {
  const panelRef = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none dark:bg-slate-900 sm:rounded-3xl",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-blue-900 dark:text-white">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose} data-close className="-mr-2 -mt-1">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children, footer }) => {
  const panelRef = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col bg-white shadow-2xl outline-none dark:bg-slate-900 sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-bold text-blue-900 dark:text-white">{title}</h2>
            {subtitle ? <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
          </div>
          <IconButton label="Close" onClick={onClose} data-close className="-mr-2 -mt-1">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</div>
        ) : null}
      </div>
    </div>
  );
};

export type MenuItem = {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

/** "More" menu for secondary and destructive actions. */
export const OverflowMenu: React.FC<{ items: MenuItem[]; label?: string }> = ({
  items,
  label = "More actions",
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </IconButton>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition disabled:opacity-50",
                item.danger
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Small key/value row used in drawers. */
export const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className="min-w-0 text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Current time that refreshes on an interval, so "live", "soon" and
 *  "past" labels stay right while a page is left open. */
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
};

export const naira = (n: number) => `₦${Math.round(Number(n) || 0).toLocaleString()}`;

export const relativeTime = (ms: number, now = Date.now()) => {
  if (!ms) return "";
  const diff = ms - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60_000) return diff >= 0 ? "in a moment" : "just now";
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 7 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), "day");
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export const classWhen = (ms: number) =>
  ms
    ? new Date(ms).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No date";

export const isSameDay = (a: number, b: number) => {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};
