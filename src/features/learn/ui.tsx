/**
 * Student area building blocks (Figma "07 Student UI"): page header, class
 * hero, session rows, weeks card, recording and resource cards, update rows.
 */
import React from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  Lock,
  MessageSquare,
  PlayCircle,
  Plus,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ResourceDoc, SessionDoc } from "../../../services/registrationStore";
import { mbtn, Tag } from "../../marketing/ui";
import { cn } from "../../ui";
import { Card, IconTile, naira, plural, Progress } from "../shared/ui";
import { addToCalendar } from "./calendar";
import { sessionInfo, startsIn } from "./time";

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

export const PageHeader: React.FC<{ title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }> = ({
  title,
  description,
  actions,
  className,
}) => (
  <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
    <div className="min-w-0 flex-1">
      <h1 className="font-display text-2xl font-bold leading-[30px] tracking-[-0.02em] text-blue-900 dark:text-white lg:text-[30px] lg:leading-9">
        {title}
      </h1>
      {description ? <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 lg:text-base lg:text-slate-600 lg:dark:text-slate-300">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);

export const SectionHead: React.FC<{ title: string; id?: string; action?: { label: string; onClick: () => void } }> = ({ title, id, action }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 id={id} className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white lg:text-[22px] lg:leading-7">
      {title}
    </h2>
    {action ? (
      <button
        type="button"
        onClick={action.onClick}
        className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline dark:text-teal-300 lg:text-blue-900 lg:dark:text-white"
      >
        {action.label} <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    ) : null}
  </div>
);

/** Bell button that opens Updates; shows an orange dot when something is new. */
export const UpdatesBell: React.FC<{ unread: boolean; className?: string; onDark?: boolean }> = ({ unread, className, onDark }) => (
  <Link
    to={"/student/notifications"}
    aria-label={unread ? "Updates, new" : "Updates"}
    className={cn(
      "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
      onDark
        ? "border-white/20 bg-white/10 text-white hover:border-white/40"
        : "border-line bg-white text-blue-900 hover:border-line-strong dark:border-line-dark dark:bg-slate-900 dark:text-white",
      className,
    )}
  >
    <Bell className="h-5 w-5" aria-hidden />
    {unread ? (
      <span className={cn("absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-orange-500 ring-2", onDark ? "ring-blue-900" : "ring-white dark:ring-slate-900")} aria-hidden />
    ) : null}
  </Link>
);

// ---------------------------------------------------------------------------
// Empty and locked
// ---------------------------------------------------------------------------

export const EmptyCard: React.FC<{ icon: LucideIcon; title: string; children?: React.ReactNode; action?: React.ReactNode; dashed?: boolean; className?: string }> = ({
  icon,
  title,
  children,
  action,
  dashed,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded-[18px] bg-white px-5 py-5 dark:bg-slate-900 sm:flex-row sm:items-center sm:px-6",
      dashed ? "border border-dashed border-line-strong dark:border-slate-600" : "border border-line dark:border-line-dark",
      className,
    )}
  >
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <IconTile icon={icon} tone="paper" />
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-5 text-blue-900 dark:text-white">{title}</p>
        {children ? <div className="mt-0.5 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{children}</div> : null}
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

// ---------------------------------------------------------------------------
// Class hero
// ---------------------------------------------------------------------------

const heroBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-line-strong bg-white px-5 text-[15px] font-bold text-blue-900 transition-colors hover:bg-paper sm:h-14 sm:rounded-[14px] sm:px-6 sm:text-base";

export type HeroKind = "class" | "locked" | "empty";

/**
 * The big teal card for the live or next class. `locked` is the white card
 * shown before the first payment; `empty` is for cohorts with no classes yet.
 */
export const ClassHero: React.FC<{
  kind: HeroKind;
  session?: SessionDoc | null;
  totalWeeks?: number;
  courseTitle?: string;
  lockedTitle?: string;
  lockedNote?: string;
  lockedLabel?: string;
  lockedMeta?: string;
  emptyTitle?: string;
  emptyNote?: string;
}> = ({ kind, session, totalWeeks, courseTitle = "", lockedTitle, lockedNote, lockedLabel, lockedMeta, emptyTitle, emptyNote }) => {
  if (kind === "locked" || kind === "empty" || !session) {
    const locked = kind === "locked";
    return (
      <Card as="section" aria-label={locked ? "Your first class" : "Classes"} className="space-y-4 rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-2.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <CalendarDays className="h-3.5 w-3.5" aria-hidden />}
            {locked ? lockedLabel || "Next live class · locked" : "Classes"}
          </span>
        </div>
        <h2 className="font-display text-[22px] font-bold leading-7 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[28px] sm:leading-[34px]">
          {locked ? lockedTitle || "Your first live class is waiting" : emptyTitle || "Your classes are being scheduled"}
        </h2>
        {locked && lockedMeta ? <p className="text-[15px] font-semibold text-slate-600 dark:text-slate-300">{lockedMeta}</p> : null}
        <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
          {locked ? lockedNote || "Classes open as soon as your first payment is confirmed." : emptyNote || "Gideon is putting the dates in. They'll show here and in the app."}
        </p>
      </Card>
    );
  }

  const i = sessionInfo(session);
  const live = i.phase === "live";
  const label = live ? "Live now" : i.phase === "soon" ? "Starting soon" : `Next live class${startsIn(i.startMs) ? ` · ${startsIn(i.startMs).toLowerCase()}` : ""}`;
  return (
    <section aria-label={live ? "Live class" : "Next class"} className="space-y-4 rounded-3xl bg-teal-600 p-5 text-white dark:bg-teal-800 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em]">
          <span className={cn("h-2 w-2 rounded-full", live ? "animate-pulse bg-orange-400" : "bg-white")} aria-hidden />
          {label}
        </span>
        {i.week ? <span className="text-[13px] font-bold text-white/85">Week {i.week}{totalWeeks ? ` of ${totalWeeks}` : ""}</span> : null}
      </div>
      <h2 className="font-display text-[22px] font-bold leading-7 tracking-[-0.02em] sm:text-[28px] sm:leading-[34px]">{i.title}</h2>
      <div className="flex flex-col gap-2 text-[15px] font-semibold sm:flex-row sm:flex-wrap sm:gap-x-6">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-[18px] w-[18px]" aria-hidden /> {live ? "Today" : i.day}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-[18px] w-[18px]" aria-hidden /> {live ? `Started ${i.startTime} · ends ${i.timeRange.split(" – ")[1]}` : `${i.timeRange} · ${i.durationMins} min`}
        </span>
      </div>
      {i.notes ? <p className="text-sm font-medium leading-[22px] text-teal-50">{i.notes}</p> : null}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {i.canJoin ? (
          <a href={i.joinUrl} target="_blank" rel="noopener noreferrer" className={heroBtn}>
            <Video className="h-5 w-5" aria-hidden /> {live ? "Join live class" : "Join class"}
          </a>
        ) : (
          <button type="button" className={heroBtn} onClick={() => addToCalendar([session], courseTitle)}>
            <CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar
          </button>
        )}
        <p className="text-sm font-medium text-white/90">
          {i.canJoin
            ? live
              ? "Gideon is live now."
              : "The class starts in a few minutes."
            : i.joinUrl
              ? "The join link opens 15 minutes before class."
              : "The join link appears here before class."}
        </p>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Session rows
// ---------------------------------------------------------------------------

/** Week badge on a row: solid while the class is live, tinted when it's coming up, grey once it's over. */
const WeekTile: React.FC<{ week: number; muted?: boolean; locked?: boolean; live?: boolean }> = ({ week, muted, locked, live }) => (
  <span
    aria-hidden
    className={cn(
      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-[15px] font-bold",
      live
        ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-blue-950"
        : muted || locked
          ? "bg-paper text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          : "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    )}
  >
    {locked ? <Lock className="h-[18px] w-[18px]" /> : week ? `W${week}` : <Video className="h-[18px] w-[18px]" />}
  </span>
);

export const SessionRow: React.FC<{ session: SessionDoc; courseTitle: string; onAsk?: () => void }> = ({ session, courseTitle, onAsk }) => {
  const i = sessionInfo(session);
  const ended = i.phase === "ended";
  const live = i.phase === "live";
  const meta = [i.week ? `Week ${i.week}` : "", i.day, ended ? `${i.durationMins} min` : i.timeRange].filter(Boolean).join(" · ");
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white px-3 py-3.5 dark:bg-slate-900 sm:gap-4 sm:px-4",
        live ? "border-[1.5px] border-teal-600 shadow-[0_8px_24px_rgba(18,128,138,0.14)] dark:border-teal-400" : "border border-line dark:border-line-dark",
      )}
    >
      <WeekTile week={i.week} muted={ended} live={live} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-[22px] text-blue-900 dark:text-white sm:text-base">{i.title}</p>
        <p className="text-[13px] font-medium leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {live && !i.canJoin ? <Tag tone="hire">Live now</Tag> : null}
        {live && i.canJoin ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300 sm:inline-flex">
            <span className="h-[7px] w-[7px] rounded-full bg-orange-500" aria-hidden /> Live now
          </span>
        ) : null}
        {i.canJoin ? (
          <a href={i.joinUrl} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "learn", size: "sm" })}>
            <Video className="h-4 w-4" aria-hidden /> <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join class</span>
            <span className="sr-only">: {i.title}</span>
          </a>
        ) : null}
        {!i.canJoin && (i.phase === "upcoming" || i.phase === "soon") ? (
          <>
            {startsIn(i.startMs) ? <Tag tone="neutral">{startsIn(i.startMs)}</Tag> : null}
            <button
              type="button"
              onClick={() => addToCalendar([session], courseTitle)}
              className={mbtn({ kind: "secondary", size: "sm", className: "hidden sm:inline-flex" })}
            >
              <CalendarPlus className="h-4 w-4" aria-hidden /> Add to calendar<span className="sr-only">: {i.title}</span>
            </button>
          </>
        ) : null}
        {ended && i.recordingUrl ? (
          <a href={i.recordingUrl} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary", size: "sm" })}>
            <PlayCircle className="h-4 w-4" aria-hidden /> <span className="sm:hidden">Watch</span>
            <span className="hidden sm:inline">Watch recording</span>
            <span className="sr-only">: {i.title}</span>
          </a>
        ) : null}
        {ended && i.recordingSoon ? <Tag tone="neutral">Recording soon</Tag> : null}
        {onAsk ? (
          <button
            type="button"
            onClick={onAsk}
            title="Ask Gideon about this class"
            className="hidden h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-paper hover:text-blue-900 dark:hover:bg-slate-800 dark:hover:text-white sm:flex"
          >
            <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
            <span className="sr-only">Ask Gideon about {i.title}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
};

/** A placeholder row for weeks the student hasn't paid for yet. */
export const LockedRow: React.FC<{ title: string; meta: string; note?: string }> = ({ title, meta, note }) => (
  <li className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3.5 dark:border-line-dark dark:bg-slate-900 sm:gap-4 sm:px-4">
    <WeekTile week={0} locked />
    <div className="min-w-0 flex-1">
      <p className="text-[15px] font-bold leading-[22px] text-slate-500 dark:text-slate-400 sm:text-base">{title}</p>
      <p className="text-[13px] font-medium leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">{meta}</p>
    </div>
    {note ? <span className="hidden shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">{note}</span> : null}
  </li>
);

// ---------------------------------------------------------------------------
// Weeks card
// ---------------------------------------------------------------------------

const weekSpan = (n: number) => (n === 1 ? "Week 1" : `Weeks 1 to ${n}`);

export const WeeksCard: React.FC<{
  state: "active" | "pending" | "checking";
  paidWeeks: number;
  totalWeeks: number;
  rate: number;
  intendedWeeks: number;
  currentWeek?: number;
  canTopUp: boolean;
  onAddWeeks: () => void;
  onPay: () => void;
  className?: string;
  /** Extra line while a payment is being checked (e.g. what Paystack received). */
  checkingNote?: string;
}> = ({ state, paidWeeks, totalWeeks, rate, intendedWeeks, currentWeek, canTopUp, onAddWeeks, onPay, className, checkingNote }) => {
  const remaining = Math.max(0, totalWeeks - paidWeeks);
  const done = state === "active" && remaining === 0;
  return (
    <Card as="section" aria-labelledby="weeks-card-title" className={cn("space-y-4 p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="weeks-card-title" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
          Your weeks
        </h2>
        {state === "active" ? (
          <Tag tone="learn">{done ? "Full course" : "Active"}</Tag>
        ) : state === "pending" ? (
          <Tag tone="hire">Payment pending</Tag>
        ) : (
          <Tag tone="neutral">Checking payment</Tag>
        )}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[32px] font-bold leading-[38px] tracking-[-0.03em] text-blue-900 dark:text-white">
          {paidWeeks} of {totalWeeks}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">weeks unlocked</span>
      </p>
      <Progress value={paidWeeks} max={totalWeeks} label="Weeks unlocked" />
      <div className="space-y-0.5 text-sm font-medium leading-[22px]">
        {state === "active" ? (
          done ? (
            <p className="text-slate-600 dark:text-slate-300">You've unlocked every week of the course.</p>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300">
                {currentWeek ? `You're on week ${Math.min(currentWeek, totalWeeks)}. ` : ""}
                {plural(remaining, "week")} left to unlock.
              </p>
              {rate > 0 ? <p className="text-slate-500 dark:text-slate-400">{naira(remaining * rate)} unlocks the rest of the course.</p> : null}
            </>
          )
        ) : state === "pending" ? (
          <>
            <p className="text-slate-600 dark:text-slate-300">
              You chose {plural(intendedWeeks, "week")}
              {rate > 0 ? ` for ${naira(intendedWeeks * rate)}` : ""}.
            </p>
            <p className="text-slate-500 dark:text-slate-400">Pay to unlock {intendedWeeks === 1 ? "week 1" : `weeks 1 to ${intendedWeeks}`}.</p>
          </>
        ) : (
          <>
            {checkingNote ? <p className="text-slate-600 dark:text-slate-300">{checkingNote}</p> : null}
            <p className={checkingNote ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}>
              {intendedWeeks > 0 ? `${weekSpan(intendedWeeks)} ${intendedWeeks === 1 ? "unlocks" : "unlock"} once it's confirmed.` : "Your weeks unlock as soon as the payment is confirmed."}
            </p>
          </>
        )}
      </div>
      {state === "active" && canTopUp ? (
        <button type="button" onClick={onAddWeeks} className={mbtn({ kind: "learn", full: true })}>
          Add weeks <Plus className="h-[18px] w-[18px]" aria-hidden />
        </button>
      ) : state === "pending" ? (
        <button type="button" onClick={onPay} className={mbtn({ kind: "learn", full: true })}>
          {rate > 0 ? `Pay ${naira(intendedWeeks * rate)}` : "Finish payment"}
        </button>
      ) : null}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Recording and resource cards
// ---------------------------------------------------------------------------

export const RecordingCard: React.FC<{ session: SessionDoc; className?: string }> = ({ session, className }) => {
  const i = sessionInfo(session);
  return (
    <a
      href={i.recordingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition-shadow hover:shadow-card dark:border-line-dark dark:bg-slate-900",
        className,
      )}
    >
      <span className="relative flex h-[124px] items-center justify-center overflow-hidden bg-blue-900 sm:h-[130px]">
        {/* The week number, set large, is the thumbnail's only graphic. */}
        {i.week ? (
          <span aria-hidden className="pointer-events-none absolute -bottom-3 left-3 select-none font-display text-[72px] font-bold leading-none tracking-[-0.05em] text-teal-400/20">
            W{i.week}
          </span>
        ) : null}
        <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full bg-teal-400 text-blue-950 transition-transform group-hover:scale-105">
          <PlayCircle className="h-6 w-6" aria-hidden />
        </span>
        <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-950/75 px-2 py-0.5 text-xs font-bold text-white">{i.durationMins} min</span>
      </span>
      <span className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3.5">
        <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          {i.week ? `Week ${i.week} · ` : ""}Recording
        </span>
        <span className="text-base font-bold leading-[22px] text-blue-900 dark:text-white">{i.title}</span>
        {i.hasTime ? <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Recorded {i.day}</span> : null}
      </span>
    </a>
  );
};

const resourceIcon = (r: ResourceDoc): LucideIcon => {
  const t = `${(r as any).type || ""}`.toLowerCase();
  if (/(link|github|notion|url|web)/.test(t)) return Link2;
  if (/(video|youtube)/.test(t)) return PlayCircle;
  return FileText;
};

export const ResourceRow: React.FC<{ resource: ResourceDoc }> = ({ resource: r }) => {
  const anyR = r as any;
  const meta = [Number(anyR.sessionWeek) > 0 ? `Week ${anyR.sessionWeek}` : anyR.folder, anyR.type, anyR.size].filter(Boolean).join(" · ");
  const Icon = resourceIcon(r);
  const body = (
    <>
      <IconTile icon={Icon} tone="paper" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-5 text-blue-900 dark:text-white">{anyR.name || "Resource"}</span>
        {meta ? <span className="mt-0.5 block text-sm font-medium text-slate-500 dark:text-slate-400">{meta}</span> : null}
        {anyR.description ? <span className="mt-1 line-clamp-2 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{anyR.description}</span> : null}
      </span>
    </>
  );
  return anyR.url ? (
    <a
      href={anyR.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 rounded-[14px] border border-line bg-white px-3.5 py-3 transition-colors hover:border-line-strong dark:border-line-dark dark:bg-slate-900"
    >
      {body}
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-teal-700 dark:text-teal-300">
        Open <ExternalLink className="h-4 w-4" aria-hidden />
      </span>
    </a>
  ) : (
    <div className="flex items-center gap-3.5 rounded-[14px] border border-line bg-white px-3.5 py-3 dark:border-line-dark dark:bg-slate-900">{body}</div>
  );
};

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export const UpdateRow: React.FC<{
  title: string;
  body?: string;
  time?: string;
  unread?: boolean;
  action?: React.ReactNode;
  icon?: LucideIcon;
}> = ({ title, body, time, unread, action, icon = Bell }) => (
  <li className="flex gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 dark:border-line-dark dark:bg-slate-900">
    <IconTile icon={icon} tone={unread ? "learn" : "paper"} />
    <div className="min-w-0 flex-1">
      <div className="flex items-start gap-2">
        <p className={cn("min-w-0 flex-1 text-[15px] leading-5 text-blue-900 dark:text-white", unread ? "font-bold" : "font-semibold")}>
          {unread ? <span className="sr-only">New: </span> : null}
          {title}
        </p>
        {time ? <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{time}</span> : null}
        {unread ? <span className="mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full bg-orange-500" aria-hidden /> : null}
      </div>
      {body ? <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</p> : null}
      {action ? <div className="mt-2.5 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  </li>
);
