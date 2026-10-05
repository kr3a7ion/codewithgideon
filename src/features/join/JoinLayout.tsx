import React from "react";
import { Link } from "react-router-dom";
import { Lockup, WhatsAppIcon } from "../../marketing/ui";
import { useContactLinks } from "../../marketing/useContactLinks";
import { cn } from "../../ui";
import { Stepper } from "./ui";

/**
 * Page frame for sign-up, sign-in and checkout: a slim header with the logo
 * and WhatsApp help, the step indicator, the main column and (on desktop)
 * an aside that keeps the chosen course or order in view. On phones the
 * aside can be replaced by a compact `mobileTop`, and a `bottomBar` sticks
 * to the bottom of the screen with the total and the main button.
 */
export const JoinLayout: React.FC<{
  step?: 1 | 2 | 3;
  aside?: React.ReactNode;
  mobileTop?: React.ReactNode;
  bottomBar?: React.ReactNode;
  width?: "narrow" | "medium";
  children: React.ReactNode;
}> = ({ step, aside, mobileTop, bottomBar, width = "medium", children }) => {
  const { whatsapp } = useContactLinks();
  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-paper-dark">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur dark:border-line-dark dark:bg-slate-950/95">
        <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center justify-between px-4 sm:h-[72px] sm:px-10">
          <Link to="/" aria-label="CodeWithGideon home" className="shrink-0">
            <Lockup className="h-[26px] sm:h-8" />
          </Link>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:underline dark:text-white"
          >
            <span className="hidden font-medium text-slate-500 dark:text-slate-400 sm:inline">Questions?</span>
            <WhatsAppIcon className="h-[18px] w-[18px] sm:hidden" />
            <span className="sm:hidden">Help</span>
            <span className="hidden sm:inline">Chat on WhatsApp</span>
          </a>
        </div>
      </header>

      <div className="flex-1">
        <div className={cn("mx-auto w-full px-5 pb-10 pt-5 sm:pb-24 sm:pt-12", aside ? "max-w-[1180px] sm:px-8" : width === "narrow" ? "max-w-[540px] sm:px-8" : "max-w-[820px] sm:px-8")}>
          {aside ? (
            <div className="lg:grid lg:grid-cols-[minmax(0,616px)_minmax(0,1fr)] lg:items-start lg:gap-16">
              <div className="space-y-5 sm:space-y-7">
                {step ? <Stepper step={step} /> : null}
                {mobileTop ? <div className="lg:hidden">{mobileTop}</div> : null}
                {children}
              </div>
              <div className="mt-8 hidden space-y-4 lg:sticky lg:top-28 lg:mt-0 lg:block">{aside}</div>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-7">
              {step ? <Stepper step={step} /> : null}
              {mobileTop}
              {children}
            </div>
          )}
        </div>
      </div>

      {bottomBar ? (
        <>
          <div className="h-24 lg:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-line-dark dark:bg-slate-950 lg:hidden">
            {bottomBar}
          </div>
        </>
      ) : null}
    </div>
  );
};

/** Total + main button for the phone bottom bar. */
export const BottomBar: React.FC<{ label: string; amount: string; children: React.ReactNode }> = ({ label, amount, children }) => (
  <div className="flex items-center gap-3">
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-display text-xl font-bold leading-[26px] text-blue-900 dark:text-white">{amount}</p>
    </div>
    {children}
  </div>
);
