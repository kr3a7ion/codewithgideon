import React, { useEffect, useState } from "react";
import { cn } from "../../ui";
import type { StudentSection } from "./lib";

// ---------------------------------------------------------------------------
// Loading placeholders
//
// While a section (or its data) is on the way, we show the outline of the
// page with a soft band of light sweeping across it, so the student sees
// where things will appear instead of a blank page. People who ask their
// device for less motion get still outlines.
// ---------------------------------------------------------------------------

/** One placeholder shape. */
export const Bone: React.FC<{ className?: string; onDark?: boolean; onCanvas?: boolean }> = ({ className, onDark, onCanvas }) => (
  <span
    aria-hidden
    className={cn(
      "relative block overflow-hidden",
      // cn doesn't merge classes, so only add a radius when none was given.
      /(^|\s)rounded-/.test(className || "") ? "" : "rounded-md",
      // A shade darker on the page background than inside white cards.
      onDark ? "bg-white/[0.12]" : onCanvas ? "bg-slate-300/60 dark:bg-slate-800" : "bg-slate-200/80 dark:bg-slate-800",
      className,
    )}
  >
    <span
      className={cn(
        "absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent to-transparent motion-reduce:hidden",
        onDark ? "via-white/[0.14]" : "via-white/70 dark:via-white/[0.07]",
      )}
    />
  </span>
);

const box = "rounded-2xl border border-line bg-white dark:border-line-dark dark:bg-slate-900";

/** Matches the page title row. Phones only show the description line. */
const HeaderBone: React.FC<{ action?: boolean; description?: boolean }> = ({ action, description = true }) => (
  <div className="flex items-center gap-4">
    <div className="min-w-0 flex-1">
      <Bone onCanvas className="mb-2.5 hidden h-8 w-52 rounded-lg lg:block" />
      {description ? <Bone onCanvas className="h-4 w-[78%] max-w-[440px]" /> : null}
    </div>
    {action ? <Bone onCanvas className="hidden h-10 w-44 rounded-xl sm:block" /> : null}
  </div>
);

/** A class row: week tile, two lines, and a button on wider screens. */
export const RowBone: React.FC<{ button?: boolean; as?: "li" | "div" }> = ({ button = true, as: Tag = "div" }) => (
  <Tag className={cn(box, "flex items-center gap-3 px-3 py-3.5 sm:gap-4 sm:px-4")} aria-hidden>
    <Bone className="h-12 w-12 shrink-0 rounded-xl" />
    <div className="min-w-0 flex-1 space-y-2">
      <Bone className="h-4 w-[62%]" />
      <Bone className="h-3 w-[38%]" />
    </div>
    {button ? <Bone className="hidden h-9 w-28 shrink-0 rounded-xl sm:block" /> : null}
  </Tag>
);

/** A resource or update row: icon tile and two or three lines. */
export const ItemBone: React.FC<{ lines?: 2 | 3; as?: "li" | "div" }> = ({ lines = 2, as: Tag = "div" }) => (
  <Tag className={cn(box, "flex gap-3.5 px-4 py-3.5")} aria-hidden>
    <Bone className="h-11 w-11 shrink-0 rounded-xl" />
    <div className="min-w-0 flex-1 space-y-2 pt-0.5">
      <Bone className="h-4 w-[55%]" />
      <Bone className="h-3 w-[85%]" />
      {lines === 3 ? <Bone className="h-3 w-[60%]" /> : null}
    </div>
  </Tag>
);

/** A list of rows, for the loading state inside a section. */
export const RowsBone: React.FC<{ count?: number; kind?: "row" | "item"; className?: string }> = ({ count = 3, kind = "row", className }) => (
  <div className={cn("space-y-2.5", className)} aria-hidden>
    {Array.from({ length: count }, (_, i) => (kind === "row" ? <RowBone key={i} /> : <ItemBone key={i} />))}
  </div>
);

/** A white card with a heading, a few lines and a button. */
const CardBone: React.FC<{ className?: string; button?: boolean }> = ({ className, button = true }) => (
  <div className={cn("rounded-[20px] border border-line bg-white p-5 dark:border-line-dark dark:bg-slate-900 sm:p-6", className)} aria-hidden>
    <Bone className="h-5 w-32" />
    <Bone className="mt-4 h-3.5 w-full" />
    <Bone className="mt-2 h-3.5 w-[70%]" />
    {button ? <Bone className="mt-5 h-11 w-full rounded-xl" /> : null}
  </div>
);

/** Chat bubbles, Gideon on the left and the student on the right. */
export const ChatBone: React.FC = () => (
  <div className="space-y-4 py-2" aria-hidden>
    {[
      ["left", "w-[68%]", 2],
      ["right", "w-[52%]", 1],
      ["left", "w-[60%]", 3],
      ["right", "w-[44%]", 1],
    ].map(([side, width, lines], i) => (
      <div key={i} className={cn("flex items-end gap-2.5", side === "right" && "flex-row-reverse")}>
        {side === "left" ? <Bone className="h-8 w-8 shrink-0 rounded-full" /> : null}
        <div className={cn("space-y-2 rounded-2xl border border-line bg-white px-4 py-3 dark:border-line-dark dark:bg-slate-900", width as string)}>
          {Array.from({ length: lines as number }, (_, l) => (
            <Bone key={l} className={cn("h-3", l === (lines as number) - 1 && (lines as number) > 1 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Whole-page outlines, one per section
// ---------------------------------------------------------------------------

const HomeSkeleton = () => (
  <div className="space-y-6 lg:space-y-7">
    <div className="-mx-4 overflow-hidden rounded-b-[28px] bg-blue-900 px-5 pb-6 pt-5 sm:mx-0 sm:rounded-[28px] sm:px-8 sm:pb-8 sm:pt-7">
      <Bone onDark className="h-6 w-56 max-w-[70%] rounded-lg" />
      <Bone onDark className="mt-2 h-4 w-40" />
      <div className="mt-6 sm:mt-8">
        <Bone onDark className="h-7 w-40 rounded-full" />
        <Bone onDark className="mt-4 h-7 w-[82%] max-w-[520px] rounded-lg sm:h-9" />
        <Bone onDark className="mt-2 h-7 w-[48%] max-w-[320px] rounded-lg sm:h-9" />
        <Bone onDark className="mt-4 h-4 w-[64%] max-w-[380px]" />
        <Bone onDark className="mt-5 h-12 w-44 rounded-xl sm:h-[52px]" />
      </div>
      <div className="mt-7 border-t border-white/10 pt-5 sm:mt-9">
        <Bone onDark className="mb-3 h-4 w-40" />
        <TrackBone onDark />
      </div>
    </div>
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7">
      <div className="space-y-3">
        <Bone onCanvas className="h-6 w-32 rounded-lg" />
        <RowsBone count={3} />
      </div>
      <div className="space-y-6">
        <CardBone />
        <CardBone />
      </div>
    </div>
  </div>
);

const ClassesSkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone action />
    <Bone onCanvas className="h-12 w-60 rounded-2xl" />
    <div className="space-y-3">
      <Bone onCanvas className="h-3.5 w-24" />
      <RowsBone count={4} />
    </div>
  </div>
);

const ResourcesSkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone />
    <div className="flex gap-2">
      {["w-24", "w-20", "w-20", "w-20"].map((w, i) => (
        <Bone onCanvas key={i} className={cn("h-9 rounded-full", w)} />
      ))}
    </div>
    <div className="grid gap-3 lg:grid-cols-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <ItemBone key={i} />
      ))}
    </div>
  </div>
);

/** Community space cards while they load. */
export const SpaceCardsBone: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2" aria-hidden>
    {[1, 2].map((i) => (
      <div key={i} className="rounded-[20px] border border-line bg-white p-5 dark:border-line-dark dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-[10px]" />
          <Bone className="h-3 w-24" />
        </div>
        <Bone className="mt-4 h-5 w-[60%]" />
        <Bone className="mt-3 h-3.5 w-full" />
        <Bone className="mt-2 h-3.5 w-[75%]" />
        <Bone className="mt-5 h-10 w-36 rounded-xl" />
      </div>
    ))}
  </div>
);

const CommunitySkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone />
    <SpaceCardsBone />
  </div>
);

const ChatSkeleton = () => (
  <div className="lg:space-y-6">
    <div className="hidden lg:block">
      <HeaderBone />
    </div>
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
      <div className="-mx-4 flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden border-b border-line bg-white dark:border-line-dark dark:bg-slate-900 sm:mx-0 sm:h-[calc(100dvh-10rem)] sm:rounded-[20px] sm:border lg:h-[calc(100vh-11rem)] lg:min-h-[520px]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 dark:border-line-dark sm:px-5">
          <Bone className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-3.5 w-20" />
            <Bone className="h-3 w-36" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-paper/60 px-4 py-4 dark:bg-slate-950/40 sm:px-5">
          <ChatBone />
        </div>
        <div className="flex gap-2 border-t border-line p-3 dark:border-line-dark sm:p-4">
          <Bone className="h-12 flex-1 rounded-xl" />
          <Bone className="h-12 w-12 rounded-xl" />
        </div>
      </div>
      <CardBone className="hidden lg:block" button={false} />
    </div>
  </div>
);

const UpdatesSkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone action />
    <div className="max-w-[760px] space-y-2.5">
      {Array.from({ length: 4 }, (_, i) => (
        <ItemBone key={i} lines={i % 2 ? 2 : 3} />
      ))}
    </div>
  </div>
);

const BadgesSkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone />
    <div className="rounded-3xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, #0F2B5B, #136B72)" }}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bone onDark className="h-14 w-14 rounded-2xl" />
          <Bone onDark className="mt-5 h-8 w-56 max-w-full rounded-lg" />
          <Bone onDark className="mt-3 h-4 w-72 max-w-full" />
        </div>
        <Bone onDark className="h-[104px] w-full rounded-2xl sm:w-[200px]" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="rounded-[18px] border border-line bg-white p-4 dark:border-line-dark dark:bg-slate-900">
          <Bone className="h-9 w-9 rounded-xl" />
          <Bone className="mt-4 h-3 w-16" />
          <Bone className="mt-2 h-4 w-[75%]" />
          <Bone className="mt-2 h-3 w-12" />
        </div>
      ))}
    </div>
  </div>
);

/** The course card on Payments & account while the course loads. */
export const CourseCardBone: React.FC = () => (
  <div className="rounded-[20px] border border-line bg-white p-5 dark:border-line-dark dark:bg-slate-900 sm:p-6" aria-hidden>
    <Bone className="h-6 w-48 rounded-lg" />
    <Bone className="mt-2 h-3.5 w-32" />
    <Bone className="mt-6 h-8 w-40 rounded-lg" />
    <TrackBone className="mt-4" />
    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map((i) => (
        <Bone key={i} className="h-16 rounded-xl" />
      ))}
    </div>
    <Bone className="mt-5 h-[52px] w-44 rounded-xl" />
  </div>
);

/** A row of week blocks while the course length is unknown. */
export const TrackBone: React.FC<{ onDark?: boolean; className?: string }> = ({ onDark, className }) => (
  <div className={cn("flex gap-1 sm:gap-1.5", className)} aria-hidden>
    {Array.from({ length: 8 }, (_, i) => (
      <Bone key={i} onDark={onDark} className="h-8 flex-1 rounded-[7px] sm:h-10 sm:rounded-lg" />
    ))}
  </div>
);

const AccountSkeleton = () => (
  <div className="space-y-5 lg:space-y-6">
    <HeaderBone />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
      <div className="space-y-5 lg:space-y-6">
        <CourseCardBone />
        <div className="rounded-[20px] border border-line bg-white p-5 dark:border-line-dark dark:bg-slate-900 sm:p-6">
          <Bone className="h-5 w-40" />
          <PaymentRowsBone className="mt-4" />
        </div>
      </div>
      <CardBone />
    </div>
  </div>
);

/** Rows in the payment history while payments load. */
export const PaymentRowsBone: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("divide-y divide-line dark:divide-line-dark", className)} aria-hidden>
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4 py-3.5">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-4 w-[45%]" />
          <Bone className="h-3 w-[30%]" />
        </div>
        <Bone className="h-4 w-20" />
      </div>
    ))}
  </div>
);

const MoreSkeleton = () => (
  <div className="mx-auto max-w-[640px] space-y-4">
    <div className="hidden lg:block">
      <HeaderBone description={false} />
    </div>
    <div className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-4 dark:border-line-dark dark:bg-slate-900">
      <Bone className="h-[52px] w-[52px] shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-5 w-[50%]" />
        <Bone className="h-3.5 w-[65%]" />
      </div>
    </div>
    <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white dark:divide-line-dark dark:border-line-dark dark:bg-slate-900">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
          <Bone className="h-10 w-10 rounded-xl" />
          <Bone className="h-4 w-[40%]" />
        </div>
      ))}
    </div>
  </div>
);

const skeletons: Record<StudentSection, React.FC> = {
  dashboard: HomeSkeleton,
  classes: ClassesSkeleton,
  resources: ResourcesSkeleton,
  community: CommunitySkeleton,
  chat: ChatSkeleton,
  notifications: UpdatesSkeleton,
  badges: BadgesSkeleton,
  account: AccountSkeleton,
  more: MoreSkeleton,
};

/**
 * The outline of a section, shown while its code downloads. Tells the
 * parent it's on screen so the top loading bar can run with it.
 */
export const SectionSkeleton: React.FC<{ section: StudentSection; label: string; onShow?: (showing: boolean) => void }> = ({ section, label, onShow }) => {
  useEffect(() => {
    onShow?.(true);
    return () => onShow?.(false);
  }, [onShow]);
  const Outline = skeletons[section] || ClassesSkeleton;
  return (
    <div aria-busy="true" className="animate-fade-in">
      <p className="sr-only" role="status">
        Loading {label}…
      </p>
      <Outline />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top loading bar
// ---------------------------------------------------------------------------

/**
 * A thin teal bar across the top of the screen while a section or its data
 * is loading. It waits a moment before appearing so quick loads don't
 * flicker, then fills and fades out when loading finishes.
 */
export const TopLoadingBar: React.FC<{ active: boolean }> = ({ active }) => {
  const [phase, setPhase] = useState<"hidden" | "loading" | "done">("hidden");

  useEffect(() => {
    if (active) {
      const t = window.setTimeout(() => setPhase("loading"), 150);
      return () => window.clearTimeout(t);
    }
    setPhase((p) => (p === "loading" ? "done" : "hidden"));
  }, [active]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = window.setTimeout(() => setPhase("hidden"), 450);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "hidden") return null;
  const done = phase === "done";
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-hidden={done || undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-300 delay-150",
        done ? "bg-transparent opacity-0" : "bg-teal-500/15 opacity-100",
      )}
    >
      <div
        className={cn(
          "h-full w-full origin-left bg-gradient-to-r from-teal-400 via-teal-500 to-teal-300 shadow-[0_0_8px_rgba(22,152,160,0.6)]",
          done ? "transition-transform duration-200" : "animate-load-bar motion-reduce:animate-none motion-reduce:opacity-70",
        )}
      />
    </div>
  );
};
