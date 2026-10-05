import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CalendarPlus, Check, Clock3, Lock, Video } from "lucide-react";
import type { SessionDoc } from "../../../services/registrationStore";
import { WhatsAppIcon } from "../../marketing/ui";
import { cn } from "../../ui";
import { naira, plural } from "../shared/ui";
import { addToCalendar } from "./calendar";
import { getBadgesForLength, studentSectionRoutes } from "./lib";
import { sessionInfo, startsIn } from "./time";
import { UpdatesBell } from "./ui";
import { Bone, TrackBone } from "./Skeleton";
import { BadgeMedal } from "./BadgeMedal";

// ---------------------------------------------------------------------------
// Week track: the whole course as a row of weeks
// ---------------------------------------------------------------------------

type BlockState = "done" | "current" | "ready" | "chosen" | "locked";

/**
 * The course as one block per week. Finished weeks are teal with a white
 * tick, the week the student is on is deeper teal with its number in white
 * and a soft glow, paid weeks still to come are pale teal, weeks they chose
 * but haven't paid for are outlined, and the rest are locked. The blocks
 * fill in once when the page loads.
 */
export const WeekTrack: React.FC<{
  total: number;
  paid: number;
  current: number;
  /** Weeks chosen but not paid yet (before the first payment). */
  chosen?: number;
  className?: string;
  /** "dark" on the navy hero, "light" on white cards. */
  tone?: "dark" | "light";
}> = ({ total, paid, current, chosen = 0, className, tone = "dark" }) => {
  const light = tone === "light";
  const weeks = Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
  const stateOf = (w: number): BlockState => {
    if (w <= paid) {
      if (current && w === current) return "current";
      return current && w < current ? "done" : "ready";
    }
    if (w <= chosen) return "chosen";
    return "locked";
  };
  const label =
    paid > 0
      ? `${current ? `You're on week ${current} of ${total}. ` : ""}${paid} of ${total} weeks unlocked.`
      : `${total}-week course. ${chosen ? `${plural(chosen, "week")} chosen, not paid yet.` : "No weeks unlocked yet."}`;
  return (
    <div className={className}>
      <div role="img" aria-label={label} className="flex items-end gap-1 sm:gap-1.5">
        {weeks.map((w, i) => {
          const st = stateOf(w);
          return (
            <span
              key={w}
              aria-hidden
              style={{ animationDelay: `${120 + i * 45}ms` }}
              className={cn(
                "flex h-8 min-w-0 flex-1 origin-bottom animate-week-in items-center justify-center rounded-[7px] text-[11px] font-bold leading-none motion-reduce:animate-none sm:h-10 sm:rounded-lg sm:text-xs",
                st === "done" && "bg-teal-500 text-white",
                // White on teal-600/700 passes 4.5:1 for the small week number.
                // A bright inner edge marks it as "you are here" on dark backgrounds.
                st === "current" &&
                  (light
                    ? "bg-teal-700 text-white dark:bg-teal-600 dark:ring-2 dark:ring-inset dark:ring-teal-300"
                    : "bg-teal-600 text-white ring-2 ring-inset ring-teal-300"),
                st === "ready" && (light ? "border border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950" : "border border-teal-300/60 bg-teal-400/25"),
                st === "chosen" && (light ? "border border-dashed border-slate-400 bg-white dark:bg-slate-900" : "border border-dashed border-white/50 bg-white/[0.06]"),
                st === "locked" && (light ? "bg-paper text-slate-400 dark:bg-slate-800 dark:text-slate-500" : "bg-white/[0.08] text-white/35"),
              )}
            >
              {st === "current" ? (
                <span className="flex h-full w-full items-center justify-center rounded-[inherit] animate-week-glow motion-reduce:animate-none">
                  {/* Long courses leave little room on phones: number only. */}
                  <span className={total > 12 ? "sm:hidden" : "hidden"}>{w}</span>
                  <span className={total > 12 ? "hidden sm:inline" : undefined}>W{w}</span>
                </span>
              ) : st === "done" && total <= 16 ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
              ) : st === "locked" && total <= 16 ? (
                <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : null}
            </span>
          );
        })}
      </div>
      <div className={cn("mt-2 flex justify-between text-xs font-semibold", light ? "text-slate-500 dark:text-slate-400" : "text-white/60")}>
        <span>Week 1</span>
        <span>Week {total}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Home hero
// ---------------------------------------------------------------------------

const solidBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 text-[15px] font-bold text-blue-950 transition-colors hover:bg-teal-300 focus-visible:ring-offset-blue-900 sm:h-[52px] sm:px-6 sm:text-base";
const ghostBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-[15px] font-bold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/15 focus-visible:ring-offset-blue-900 sm:h-[52px] sm:px-6 sm:text-base";

export type HeroState = "active" | "pending" | "checking";

/**
 * The top of Home: who you are, what's next, and where you are in the
 * course. Navy, with the week track as its one graphic.
 */
export const HomeHero: React.FC<{
  state: HeroState;
  greeting: string;
  courseTitle: string;
  session: SessionDoc | null;
  loading?: boolean;
  totalWeeks: number;
  paidWeeks: number;
  currentWeek: number;
  /** Weeks with a finished class: one badge each. */
  completedWeeks: number;
  intendedWeeks: number;
  weeklyRate: number;
  remainingWeeks: number;
  hasPastClasses: boolean;
  nextCohort: string | null;
  reviewAmount?: number;
  whatsapp: string;
  unreadUpdates: boolean;
  /** The course length isn't known yet: show placeholder weeks. */
  progressLoading?: boolean;
  onPay: () => void;
}> = (p) => {
  const badges = getBadgesForLength(p.totalWeeks);
  // The latest badge earned: one per week with a finished class (the same
  // rule as the app). Hidden until the classes load.
  const earned = p.state === "active" && !p.loading ? Math.min(p.completedWeeks, badges.length) : 0;
  const badge = earned ? badges[earned - 1] : null;
  const i = p.session ? sessionInfo(p.session) : null;
  const live = i?.phase === "live";

  // ---- what the big line says ----
  let pill: React.ReactNode;
  let title: string;
  let body: React.ReactNode = null;
  let actions: React.ReactNode = null;

  if (p.state === "pending") {
    pill = (
      <>
        <Lock className="h-3.5 w-3.5" aria-hidden /> Not paid yet
      </>
    );
    title = p.nextCohort ? `Your first class is on ${p.nextCohort}` : "Your first live class is waiting";
    body = `You chose ${plural(p.intendedWeeks, "week")} of ${p.courseTitle}. Pay to unlock your classes, recordings and mentor chat.`;
    actions = (
      <button type="button" onClick={p.onPay} className={solidBtn}>
        {p.weeklyRate > 0 ? `Pay ${naira(p.intendedWeeks * p.weeklyRate)}` : "Finish payment"}
      </button>
    );
  } else if (p.state === "checking") {
    pill = (
      <>
        <Clock3 className="h-3.5 w-3.5" aria-hidden /> Confirming payment
      </>
    );
    title = "We're confirming your payment";
    body = `${p.reviewAmount ? `Paystack received ${naira(p.reviewAmount)}. ` : ""}Your weeks unlock once it's confirmed, usually within a few hours. You don't need to pay again.`;
    actions = (
      <a href={p.whatsapp} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
        <WhatsAppIcon className="h-5 w-5" /> Message Gideon
      </a>
    );
  } else if (p.loading) {
    pill = <>Loading your classes…</>;
    title = "";
  } else if (i && p.session) {
    const soon = startsIn(i.startMs);
    pill = live ? (
      <>
        <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400 motion-reduce:animate-none" aria-hidden /> Live now
      </>
    ) : (
      <>
        <span className="h-2 w-2 rounded-full bg-teal-300" aria-hidden />
        {i.phase === "soon" ? "Starting soon" : `Next live class${soon ? ` · ${soon.toLowerCase()}` : ""}`}
      </>
    );
    title = i.title;
    body = (
      <span className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-[18px] w-[18px] text-teal-300" aria-hidden /> {live ? "Today" : i.day}
          {i.week ? ` · Week ${i.week}` : ""}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-[18px] w-[18px] text-teal-300" aria-hidden />
          {live ? `Started ${i.startTime}, ends ${i.timeRange.split(" – ")[1]}` : `${i.timeRange} · ${i.durationMins} min`}
        </span>
      </span>
    );
    actions = (
      <>
        {i.canJoin ? (
          <a href={i.joinUrl} target="_blank" rel="noopener noreferrer" className={solidBtn}>
            <Video className="h-5 w-5" aria-hidden /> {live ? "Join live class" : "Join class"}
          </a>
        ) : (
          <button type="button" onClick={() => addToCalendar([p.session!], p.courseTitle)} className={ghostBtn}>
            <CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar
          </button>
        )}
        <span className="text-sm font-medium text-white/75">
          {i.canJoin ? (live ? "Gideon is live now." : "The class starts in a few minutes.") : i.joinUrl ? "The join link opens 15 minutes before class." : "The join link appears here before class."}
        </span>
      </>
    );
  } else if (p.hasPastClasses && p.remainingWeeks > 0) {
    pill = <>Up to date</>;
    title = "You've had every class you paid for";
    body = "Add weeks to unlock the next classes. Recordings of past classes are below.";
  } else {
    pill = <>Classes</>;
    title = "Your classes are being scheduled";
    body = "Gideon is adding the dates. They'll show here and in the app.";
  }

  return (
    <section
      aria-label="Your next class and progress"
      className="relative -mx-4 overflow-hidden rounded-b-[28px] bg-blue-900 px-5 pb-6 pt-5 text-white sm:mx-0 sm:rounded-[28px] sm:px-8 sm:pb-8 sm:pt-7"
    >
      {/* One soft light source behind the track, nothing else decorative. */}
      <span aria-hidden className="pointer-events-none absolute -bottom-24 right-[-10%] h-64 w-[70%] rounded-full bg-teal-500/25 blur-3xl" />

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-7 tracking-[-0.01em] text-white sm:text-2xl">{p.greeting}</h1>
            <p className="mt-0.5 text-sm font-medium text-white/70 sm:text-[15px]">{p.courseTitle}</p>
          </div>
          <UpdatesBell unread={p.unreadUpdates} onDark className="hidden lg:flex" />
        </div>

        <div className="mt-6 sm:mt-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold text-white">{pill}</span>
          {title ? (
            <h2 className="mt-3 max-w-[22ch] font-display text-[26px] font-bold leading-[32px] tracking-[-0.02em] sm:max-w-[28ch] sm:text-[34px] sm:leading-[40px]">
              {title}
            </h2>
          ) : (
            <div className="mt-3 space-y-2">
              <Bone onDark className="h-8 w-[80%] max-w-[460px] rounded-lg sm:h-9" />
              <Bone onDark className="h-8 w-[50%] max-w-[300px] rounded-lg sm:h-9" />
            </div>
          )}
          {body ? <div className="mt-3 max-w-[60ch] text-[15px] font-semibold leading-6 text-white/85">{body}</div> : null}
          {actions ? <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">{actions}</div> : null}
        </div>

        {p.progressLoading ? (
          <div className="mt-7 border-t border-white/10 pt-5 sm:mt-9" aria-hidden>
            <Bone onDark className="mb-3 h-5 w-40" />
            <TrackBone onDark />
            <div className="mt-2 h-4" />
          </div>
        ) : (
          <div className="mt-7 border-t border-white/10 pt-5 sm:mt-9">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-sm font-bold text-white">
                {p.state === "active"
                  ? `${p.paidWeeks} of ${p.totalWeeks} weeks unlocked`
                  : p.state === "checking"
                    ? `${plural(p.intendedWeeks, "week")} waiting to unlock`
                    : `${plural(p.intendedWeeks, "week")} chosen, not paid yet`}
              </p>
              {badge ? (
                <Link
                  to={studentSectionRoutes.badges}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-3 text-[13px] font-bold text-white hover:bg-white/15"
                >
                  <BadgeMedal badge={badge} size={30} className="-my-1.5" />
                  {badge.title}
                  <span className="sr-only">: your latest badge, week {badge.week}</span>
                </Link>
              ) : null}
            </div>
            <WeekTrack total={p.totalWeeks} paid={p.state === "active" ? p.paidWeeks : 0} current={p.state === "active" ? p.currentWeek : 0} chosen={p.state === "active" ? 0 : p.intendedWeeks} />
          </div>
        )}
      </div>
    </section>
  );
};
