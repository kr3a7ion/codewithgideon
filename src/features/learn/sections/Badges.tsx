import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { mbtn } from "../../../marketing/ui";
import { cn } from "../../../ui";
import { Dialog } from "../../shared/Dialog";
import { Card, Progress } from "../../shared/ui";
import { BadgeMedal, MedalSparkles, badgeGlow, type MedalState } from "../BadgeMedal";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { clamp, getBadgesForLength, type JourneyBadge } from "../lib";
import { sessionInfo } from "../time";
import { SectionHead } from "../ui";
import { BadgesBodyBone } from "../Skeleton";

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** 2 columns on phones, 3 on tablets, 4 on desktops. */
const useJourneyColumns = () => {
  const read = () => (typeof window === "undefined" ? 2 : window.matchMedia("(min-width: 1024px)").matches ? 4 : window.matchMedia("(min-width: 640px)").matches ? 3 : 2);
  const [cols, setCols] = useState(read);
  useEffect(() => {
    const queries = ["(min-width: 640px)", "(min-width: 1024px)"].map((q) => window.matchMedia(q));
    const onChange = () => setCols(read());
    queries.forEach((m) => m.addEventListener("change", onChange));
    return () => queries.forEach((m) => m.removeEventListener("change", onChange));
  }, []);
  return cols;
};

const ROW = { 2: 184, 3: 192, 4: 196 } as const;
const TOP = 58;

/**
 * The badges as a winding path: left to right, then back, like a board
 * game. The part of the path the student has walked is teal; the rest is
 * a dotted trail.
 */
const JourneyPath: React.FC<{
  badges: JourneyBadge[];
  earned: number;
  stateOf: (b: JourneyBadge) => MedalState;
  statusOf: (b: JourneyBadge) => string;
  onOpen: (week: number) => void;
}> = ({ badges, earned, stateOf, statusOf, onOpen }) => {
  const cols = useJourneyColumns();
  const row = ROW[cols as 2 | 3 | 4];
  const rows = Math.ceil(badges.length / cols);
  const height = TOP + (rows - 1) * row + 128;

  const points = badges.map((_, i) => {
    const r = Math.floor(i / cols);
    const c = r % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: ((c + 0.5) * 100) / cols, y: TOP + r * row, r };
  });

  const segment = (a: (typeof points)[number], b: (typeof points)[number]) => {
    if (a.r === b.r) return `L ${b.x} ${b.y}`;
    // Turning to the next row: swing out towards the edge.
    const edge = a.x > 50 ? a.x + (100 - a.x) * 0.78 : a.x * 0.22;
    return `C ${edge} ${a.y}, ${edge} ${b.y}, ${b.x} ${b.y}`;
  };
  const path = (from: number, to: number) => {
    if (to <= from) return "";
    let d = `M ${points[from].x} ${points[from].y}`;
    for (let i = from + 1; i <= to; i += 1) d += ` ${segment(points[i - 1], points[i])}`;
    return d;
  };
  const walked = earned >= 2 ? path(0, earned - 1) : "";
  const ahead = path(Math.max(0, earned - 1), badges.length - 1);

  return (
    <div className="relative mx-auto w-full max-w-[880px]" style={{ height }}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
        {ahead ? (
          <path
            d={ahead}
            fill="none"
            className="stroke-[#C2CDDC] dark:stroke-slate-600"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="0.5 11"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {walked ? (
          <path d={walked} fill="none" className="stroke-teal-500 dark:stroke-teal-400" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ) : null}
      </svg>

      <ol className="contents">
        {badges.map((b, i) => {
          const st = stateOf(b);
          const p = points[i];
          const lit = st === "earned" || st === "latest";
          return (
            <li key={b.week} className="absolute w-36 -translate-x-1/2" style={{ left: `${p.x}%`, top: p.y - 40 }}>
              <button
                type="button"
                onClick={() => onOpen(b.week)}
                className="group flex w-full flex-col items-center rounded-2xl pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                <span className="relative flex h-[92px] items-start justify-center">
                  {st === "latest" || st === "next" ? (
                    <span
                      className={cn(
                        "absolute -top-3 z-10 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em] shadow-sm",
                        st === "latest" ? "bg-blue-900 text-white dark:bg-white dark:text-blue-950" : "animate-bob bg-teal-600 text-white motion-reduce:animate-none",
                      )}
                    >
                      {st === "latest" ? "Latest" : "Up next"}
                    </span>
                  ) : null}
                  <BadgeMedal
                    badge={b}
                    state={st}
                    size={84}
                    className={cn("h-auto w-[78px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 motion-reduce:transform-none sm:w-[84px]")}
                  />
                </span>
                <span className="mt-1.5 rounded-xl bg-white px-2 py-1 text-center dark:bg-slate-900">
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Week {b.week}</span>
                  <span className={cn("block whitespace-nowrap text-[14px] font-bold leading-5", lit ? "text-blue-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                    {b.title}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex items-center gap-1 text-xs font-semibold",
                      lit ? "text-teal-700 dark:text-teal-300" : st === "next" ? "text-blue-900 dark:text-slate-200" : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {lit ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : null}
                    {lit ? "Earned" : st === "next" ? "Up next" : "Locked"}
                  </span>
                  <span className="sr-only">. {statusOf(b)}. Open details.</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/** A bigger look at one badge, with arrows to flick through the rest. */
const BadgeDialog: React.FC<{
  badges: JourneyBadge[];
  week: number | null;
  onWeek: (week: number | null) => void;
  stateOf: (b: JourneyBadge) => MedalState;
  statusOf: (b: JourneyBadge) => string;
  addWeeksFor: (b: JourneyBadge) => (() => void) | null;
}> = ({ badges, week, onWeek, stateOf, statusOf, addWeeksFor }) => {
  const b = badges.find((x) => x.week === week) || null;
  const index = b ? badges.indexOf(b) : -1;
  const st = b ? stateOf(b) : "locked";
  const lit = st === "earned" || st === "latest";
  const action = b ? addWeeksFor(b) : null;

  useEffect(() => {
    if (!b) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && index < badges.length - 1) onWeek(badges[index + 1].week);
      if (e.key === "ArrowLeft" && index > 0) onWeek(badges[index - 1].week);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [b, index, badges, onWeek]);

  return (
    <Dialog open={!!b} onClose={() => onWeek(null)} title={b ? `Week ${b.week} badge` : "Badge"} className="student-app">
      {b ? (
        <div className="text-center">
          <div
            className="relative -mx-5 -mt-2 flex justify-center overflow-hidden px-5 pb-2 pt-4 sm:-mx-6"
            style={lit ? { background: `radial-gradient(circle at 50% 45%, ${badgeGlow(b.color, 0.28)}, transparent 62%)` } : undefined}
          >
            <span key={b.week} className="relative inline-flex animate-badge-pop motion-reduce:animate-none">
              {lit ? <MedalSparkles color={b.color} /> : null}
              <BadgeMedal badge={b} state={st === "latest" ? "latest" : st} size={168} shineOnMount={st === "earned"} />
            </span>
          </div>
          <p className={cn("mt-3 text-xs font-extrabold uppercase tracking-[0.12em]", lit ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400")}>{b.tier}</p>
          <p className="mt-1 font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white">{b.title}</p>
          <p className="mx-auto mt-1.5 max-w-[32ch] text-[15px] font-medium leading-6 text-slate-600 dark:text-slate-300">{b.tagline}</p>
          <p
            className={cn(
              "mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold",
              lit ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200" : "bg-paper text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {lit ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
            {statusOf(b)}
          </p>
          {action ? (
            <button type="button" onClick={action} className={mbtn({ kind: "learn", full: true, className: "mt-5" })}>
              Add weeks <Plus className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 dark:border-line-dark">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => onWeek(badges[index - 1].week)}
              className="inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-blue-900 hover:bg-paper disabled:invisible dark:text-white dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden /> Week {index > 0 ? badges[index - 1].week : ""}
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {index + 1} of {badges.length}
            </span>
            <button
              type="button"
              disabled={index >= badges.length - 1}
              onClick={() => onWeek(badges[index + 1].week)}
              className="inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-blue-900 hover:bg-paper disabled:invisible dark:text-white dark:hover:bg-slate-800"
            >
              Week {index < badges.length - 1 ? badges[index + 1].week : ""} <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

/**
 * Badges (/student/badges). One badge per week of the course, earned when
 * that week's class has finished (the same rule as the mobile app).
 */
const Badges: React.FC = () => {
  const s = useStudent();
  const badges = useMemo(() => getBadgesForLength(s.totalProgramWeeks), [s.totalProgramWeeks]);
  const active = s.paymentState === "active";
  const earned = active ? clamp(s.completedWeeks, 0, badges.length) : 0;
  const latest = earned ? badges[earned - 1] : null;
  const next = badges[earned] || null;
  const spotlight = latest || next || badges[0];
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  // When each week's last class ended, for "Earned on 26 Sept".
  const earnedOn = useMemo(() => {
    const out: Record<number, number> = {};
    s.pastSessions.forEach((x) => {
      const i = sessionInfo(x);
      if (i.week > 0 && Number.isFinite(i.endMs)) out[i.week] = Math.max(out[i.week] || 0, i.endMs);
    });
    return out;
  }, [s.pastSessions]);

  const stateOf = (b: JourneyBadge): MedalState => (b.week < earned ? "earned" : b.week === earned ? "latest" : b.week === earned + 1 ? "next" : "locked");

  const statusOf = (b: JourneyBadge) => {
    if (b.week <= earned) return earnedOn[b.week] ? `Earned on ${shortDate(earnedOn[b.week])}` : `Earned after week ${b.week}`;
    if (s.paymentState === "pending") return "Pay for your weeks to start earning badges";
    if (s.paymentState === "checking") return "Opens once your payment is confirmed";
    if (b.week > s.paidWeeks) return `Add week ${b.week} to earn it`;
    return `Earn it after your week ${b.week} class`;
  };

  const addWeeksFor = (b: JourneyBadge) =>
    active && b.week > s.paidWeeks && s.canTopUp && !s.topUpInReview
      ? () => {
          setOpenWeek(null);
          s.openTopUp();
        }
      : null;

  // Earned badges come from finished classes, so wait for them.
  const loading = s.courseWeeksLoading || (active && s.sessionsLoading);
  const pct = Math.round((earned / badges.length) * 100);
  const heroState: MedalState = latest ? "latest" : "next";

  return (
    <div className="space-y-6 lg:space-y-7">
      <StudentPageHeader title="Badges" description="Earn a badge for every week of classes you finish. The same badges show in the app." />

      {loading ? (
        <BadgesBodyBone />
      ) : (
        <>
          {/* Latest badge and what's next */}
          <section
            aria-label={latest ? `Your latest badge: ${latest.title}` : "Your first badge"}
            className="relative overflow-hidden rounded-[28px] bg-blue-900 p-5 text-white sm:p-8"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl sm:-left-10 sm:-top-12 sm:translate-x-0"
              style={{ background: badgeGlow(spotlight.color, latest ? 0.32 : 0.16) }}
            />
            <span aria-hidden className="pointer-events-none absolute -bottom-24 right-[-10%] h-64 w-[60%] rounded-full bg-teal-500/20 blur-3xl" />

            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
              <button type="button" onClick={() => setOpenWeek(spotlight.week)} className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-900">
                {latest ? <MedalSparkles color={latest.color} /> : null}
                <BadgeMedal badge={spotlight} state={heroState} size={168} className="h-auto w-[148px] sm:w-[168px]" />
                <span className="sr-only">Open {spotlight.title}</span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal-300">{latest ? `Week ${latest.week} badge · ${latest.tier}` : "Your first badge"}</p>
                <h2 className="mt-2 font-display text-[28px] font-bold leading-9 tracking-[-0.02em] sm:text-[34px] sm:leading-[42px]">
                  {latest ? latest.title : `${spotlight.title} is waiting`}
                </h2>
                <p className="mx-auto mt-1.5 max-w-[46ch] text-[15px] font-semibold leading-6 text-white/85 sm:mx-0">
                  {latest ? latest.tagline : statusOf(spotlight) + "."}
                </p>
                <div className="mt-5 max-w-md sm:mt-6">
                  <div className="flex items-baseline justify-between gap-3 text-sm font-bold">
                    <span>
                      {earned} of {badges.length} badges earned
                    </span>
                    <span className="text-white/70">{pct}%</span>
                  </div>
                  <Progress value={earned} max={badges.length} label="Badges earned" size="md" track="bg-white/15" className="mt-2" />
                </div>
              </div>
            </div>

            {latest && next ? (
              <button
                type="button"
                onClick={() => setOpenWeek(next.week)}
                className="relative mt-6 flex w-full items-center gap-3.5 rounded-2xl bg-white/[0.08] p-3 pr-4 text-left ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.12] sm:mt-7"
              >
                <span className="rounded-xl bg-white p-1 dark:bg-slate-900">
                  <BadgeMedal badge={next} state="next" size={48} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-teal-300">Up next · Week {next.week}</span>
                  <span className="block font-display text-[17px] font-bold leading-6">{next.title}</span>
                  <span className="block text-sm font-medium text-white/75">{statusOf(next)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
              </button>
            ) : !next ? (
              <p className="relative mt-6 rounded-2xl bg-white/[0.08] px-4 py-3 text-center text-[15px] font-bold ring-1 ring-inset ring-white/10 sm:text-left">
                You've earned every badge. Champion.
              </p>
            ) : null}

            {s.paymentState === "pending" ? (
              <div className="relative mt-6 flex justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={s.continuePayment}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-400 px-5 text-[15px] font-bold text-blue-950 hover:bg-teal-300"
                >
                  Finish payment
                </button>
              </div>
            ) : null}
          </section>

          {/* The whole course as a path */}
          <section aria-labelledby="badges-journey" className="space-y-3">
            <SectionHead title="Your journey" id="badges-journey" />
            <Card className="px-2 pb-2 pt-8 sm:px-6">
              <JourneyPath badges={badges} earned={earned} stateOf={stateOf} statusOf={statusOf} onOpen={setOpenWeek} />
            </Card>
          </section>

          <BadgeDialog badges={badges} week={openWeek} onWeek={setOpenWeek} stateOf={stateOf} statusOf={statusOf} addWeeksFor={addWeeksFor} />
        </>
      )}
    </div>
  );
};

export default Badges;
