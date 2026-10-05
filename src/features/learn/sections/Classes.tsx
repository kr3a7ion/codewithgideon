import React, { useMemo, useRef, useState } from "react";
import { CalendarDays, CalendarPlus, Lock, Plus } from "lucide-react";
import type { SessionDoc } from "../../../../services/registrationStore";
import { mbtn, Tag } from "../../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../../marketing/useContactLinks";
import { cn } from "../../../ui";
import { GroupLabel, Notice, naira } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { RowsBone } from "../Skeleton";
import { addToCalendar } from "../calendar";
import { sessionInfo } from "../time";
import { EmptyCard, LockedRow, RecordingCard, SessionRow } from "../ui";

type Tab = "upcoming" | "recordings" | "all";

const weekOf = (s: SessionDoc) => Number((s as any).week) || 0;

/** Groups classes by week, keeping the order they were given in. */
const byWeek = (list: SessionDoc[]) => {
  const groups: { week: number; items: SessionDoc[] }[] = [];
  list.forEach((s) => {
    const w = weekOf(s);
    const g = groups.find((x) => x.week === w);
    if (g) g.items.push(s);
    else groups.push({ week: w, items: [s] });
  });
  return groups;
};

const Classes: React.FC = () => {
  const s = useStudent();
  const { nextCohortDate } = useContactLinks();
  const nextCohort = upcomingCohortLabel(nextCohortDate);
  const [tab, setTab] = useState<Tab>("upcoming");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ upcoming: null, recordings: null, all: null });
  const locked = s.paymentState !== "active";
  const course = s.courseTitle;

  const recordings = useMemo(() => s.pastSessions.filter((x) => String((x as any).recordingUrl || "").trim()), [s.pastSessions]);
  const all = useMemo(
    () =>
      [...s.sessions].sort((a, b) => {
        const ai = sessionInfo(a);
        const bi = sessionInfo(b);
        return ai.week - bi.week || (ai.hasTime ? ai.startMs : Infinity) - (bi.hasTime ? bi.startMs : Infinity);
      }),
    [s.sessions],
  );
  const calendarable = s.upcomingSessions.filter((x) => sessionInfo(x).hasTime);

  const groupLabel = (w: number) => {
    if (!w) return "Other classes";
    if (tab !== "recordings" && s.currentWeek) {
      if (w === s.currentWeek) return `This week · Week ${w}`;
      if (w === s.currentWeek + 1) return `Next week · Week ${w}`;
    }
    return `Week ${w}`;
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: s.upcomingSessions.length },
    { key: "recordings", label: "Recordings", count: recordings.length },
    { key: "all", label: "All", count: all.length },
  ];

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].key;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const askAbout = (x: SessionDoc) => {
    const i = sessionInfo(x);
    s.askAbout({ sessionId: String((x as any).id || ""), sessionTitle: `${i.week ? `Week ${i.week} · ` : ""}${i.title}` });
  };

  const lockedWeeksCard =
    !locked && s.remainingWeeks > 0 ? (
      <section aria-labelledby="classes-locked" className="space-y-3">
        <div className="flex items-center gap-3">
          <GroupLabel as="h2">
            <span id="classes-locked">
              {s.paidWeeks + 1 === s.totalProgramWeeks ? `Week ${s.totalProgramWeeks}` : `Weeks ${s.paidWeeks + 1} to ${s.totalProgramWeeks}`}
            </span>
          </GroupLabel>
          <Tag tone="neutral">Locked</Tag>
        </div>
        <EmptyCard
          icon={Lock}
          dashed
          title={`${s.remainingWeeks} more ${s.remainingWeeks === 1 ? "week" : "weeks"} of classes`}
          action={
            s.canTopUp && !s.topUpInReview ? (
              <button type="button" onClick={s.openTopUp} className={mbtn({ kind: "learn" })}>
                Add weeks <Plus className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ) : null
          }
        >
          {s.topUpInReview
            ? "Your top-up is being confirmed. The new weeks show here once it is."
            : `Add weeks to unlock them${s.weeklyRate ? `, ${naira(s.weeklyRate)} a week` : ""}. Every class is recorded.`}
        </EmptyCard>
      </section>
    ) : null;

  const listFor = (list: SessionDoc[], asCards = false) =>
    byWeek(list).map((g) => (
      <section key={g.week} aria-label={groupLabel(g.week)} className="space-y-3">
        <GroupLabel as="h2">{groupLabel(g.week)}</GroupLabel>
        {asCards ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map((x) => (
              <RecordingCard key={(x as any).id} session={x} />
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {g.items.map((x) => (
              <SessionRow key={(x as any).id} session={x} courseTitle={course} onAsk={() => askAbout(x)} />
            ))}
          </ul>
        )}
      </section>
    ));

  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader
        title="Classes"
        description={`${s.courseCadence || "Live classes with Gideon"}. Every class is recorded.`}
        actions={
          !locked && calendarable.length ? (
            <button type="button" onClick={() => addToCalendar(calendarable, course)} className={mbtn({ kind: "secondary", size: "sm", className: "hidden sm:inline-flex" })}>
              Add classes to my calendar <CalendarPlus className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null
        }
        compactOnPhone={false}
      />

      {locked ? (
        <div className="space-y-5">
          {s.paymentState === "pending" ? (
            <Notice
              tone="pending"
              title="Your classes unlock after payment"
              action={
                <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn" })}>
                  {s.weeklyRate ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
                </button>
              }
            >
              {nextCohort ? `Classes start ${nextCohort}. ` : ""}Every class you pay for shows here with its join link and recording.
            </Notice>
          ) : (
            <Notice tone="review" title="We're confirming your payment" role="status">
              Your classes show here as soon as it's confirmed. You don't need to pay again.
            </Notice>
          )}
          <section aria-label="Locked weeks" className="space-y-3">
            <GroupLabel as="h2">{s.intendedWeeks > 1 ? `Weeks 1 to ${Math.min(3, s.intendedWeeks)}` : "Week 1"}</GroupLabel>
            <ul className="space-y-2.5">
              {Array.from({ length: Math.min(3, Math.max(1, s.intendedWeeks)) }, (_, i) => (
                <LockedRow
                  key={i}
                  title={`Week ${i + 1} classes`}
                  meta="Live with Gideon · recorded"
                  note={s.paymentState === "pending" ? "Unlocks after payment" : "Opens once confirmed"}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : s.sessionsLoading ? (
        <RowsBone count={3} />
      ) : !s.sessions.length ? (
        <>
          <EmptyCard icon={CalendarDays} title="No classes scheduled yet">
            Gideon is adding the dates. They'll show here and in the app.
          </EmptyCard>
          {lockedWeeksCard}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Show classes" className="inline-flex rounded-2xl border border-line bg-white p-1 dark:border-line-dark dark:bg-slate-900">
              {tabs.map((t, index) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    ref={(el) => {
                      tabRefs.current[t.key] = el;
                    }}
                    role="tab"
                    id={`classes-tab-${t.key}`}
                    aria-selected={on}
                    aria-controls="classes-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setTab(t.key)}
                    onKeyDown={(e) => onTabKey(e, index)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm transition-colors sm:gap-2 sm:px-3.5",
                      on ? "bg-teal-50 font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-200" : "font-semibold text-slate-600 hover:text-blue-900 dark:text-slate-300 dark:hover:text-white",
                    )}
                  >
                    {t.label}
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                        on ? "bg-teal-600 text-white" : "bg-paper text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                      )}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {calendarable.length ? (
              <button type="button" onClick={() => addToCalendar(calendarable, course)} className={mbtn({ kind: "secondary", size: "sm", className: "sm:hidden" })}>
                <CalendarPlus className="h-[18px] w-[18px]" aria-hidden /> Add all to calendar
              </button>
            ) : null}
          </div>

          <div id="classes-panel" role="tabpanel" aria-labelledby={`classes-tab-${tab}`} className="space-y-6">
            {tab === "upcoming" ? (
              s.upcomingSessions.length ? (
                listFor(s.upcomingSessions)
              ) : (
                <EmptyCard icon={CalendarDays} title="No upcoming classes right now">
                  {s.remainingWeeks > 0 ? "You've had every class in the weeks you paid for." : "New classes show here as soon as they're scheduled."}
                </EmptyCard>
              )
            ) : null}
            {tab === "recordings" ? (
              recordings.length ? (
                listFor(recordings, true)
              ) : (
                <EmptyCard icon={CalendarDays} title="No recordings yet">
                  Recordings usually go up within a day of each class.
                </EmptyCard>
              )
            ) : null}
            {tab === "all" ? listFor(all) : null}
            {tab !== "recordings" ? lockedWeeksCard : null}
          </div>
        </>
      )}
    </div>
  );
};

export default Classes;
