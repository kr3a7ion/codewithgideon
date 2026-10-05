import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../ui";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog: centred card on desktop, bottom sheet on phones. Traps
 * focus, closes on Escape or a click on the backdrop, locks page scroll and
 * gives focus back to whatever opened it.
 */
export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Element to focus first (defaults to the first focusable). */
  initialFocus?: React.RefObject<HTMLElement>;
  size?: "sm" | "md";
}> = ({ open, onClose, title, description, children, className, initialFocus, size = "sm" }) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const target = initialFocus?.current || panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) || panelRef.current;
      target?.focus();
    }, 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="print-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-blue-950/50 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift outline-none dark:bg-slate-900 sm:rounded-3xl sm:p-6",
          size === "md" ? "sm:max-w-[560px]" : "sm:max-w-[440px]",
          className,
        )}
      >
        <div className="no-print mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start gap-3">
          <h2 id={titleId} className="min-w-0 flex-1 font-display text-xl font-bold leading-7 text-blue-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="no-print -mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-paper hover:text-blue-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {description ? (
          <div id={descId} className="mt-1.5 text-[15px] font-medium leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </div>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
