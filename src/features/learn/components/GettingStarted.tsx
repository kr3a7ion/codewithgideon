import React, { useEffect, useState } from "react";
import { CalendarPlus, Check, MessageSquare, PlayCircle, Smartphone, Users, X } from "lucide-react";
import { useContactLinks } from "../../../marketing/useContactLinks";
import { cn } from "../../../ui";
import { Card, Progress } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { addToCalendar } from "../calendar";
import { sessionInfo } from "../time";

type Step = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; done: boolean; run?: () => void; href?: string };

const read = (key: string): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

/** First-week checklist on Home for a newly paid student. Hides itself when done or dismissed. */
export const GettingStarted: React.FC = () => {
  const s = useStudent();
  const { apk } = useContactLinks();
  const storeKey = `cwg_getting_started_${s.profile?.uid || "anon"}`;
  const [ticks, setTicks] = useState<Record<string, boolean>>(() => read(storeKey));
  useEffect(() => setTicks(read(storeKey)), [storeKey]);
  const mark = (key: string) => {
    const next = { ...ticks, [key]: true };
    setTicks(next);
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  if (s.paymentState !== "active" || ticks.dismissed) return null;

  const group = s.communitySpaces.find((x: any) => String(x.roomUrl || "").trim()) as any;
  const calendarable = s.upcomingSessions.filter((x) => sessionInfo(x).hasTime);
  const steps: Step[] = [
    group
      ? { key: "group", label: `Join ${group.title || "your cohort group"}`, icon: Users, done: !!ticks.group, href: group.roomUrl, run: () => mark("group") }
      : null,
    calendarable.length
      ? { key: "calendar", label: "Add your classes to your calendar", icon: CalendarPlus, done: !!ticks.calendar, run: () => {
          addToCalendar(calendarable, s.courseTitle);
          mark("calendar");
        } }
      : null,
    { key: "hello", label: "Say hi to Gideon in Mentor chat", icon: MessageSquare, done: s.mentorMessages.some((m) => m.senderType === "user"), run: () => s.goTo("chat") },
    s.pastSessions.some((x) => String((x as any).recordingUrl || "").trim())
      ? { key: "watch", label: "Watch your first recording", icon: PlayCircle, done: Object.values(s.progress).some((p) => p.completed), run: () => s.goTo("classes") }
      : null,
    apk ? { key: "app", label: "Get the Android app", icon: Smartphone, done: !!ticks.app, href: apk, run: () => mark("app") } : null,
  ].filter(Boolean) as Step[];

  const done = steps.filter((x) => x.done).length;
  if (!steps.length || done === steps.length) return null;

  return (
    <Card as="section" aria-labelledby="getting-started" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="getting-started" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
            Get set up
          </h2>
          <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            {done} of {steps.length} done
          </p>
        </div>
        <button
          type="button"
          onClick={() => mark("dismissed")}
          className="-mr-1.5 -mt-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-paper hover:text-blue-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Hide this checklist"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <Progress value={done} max={steps.length} label="Set-up steps done" className="mt-3" />
      <ul className="mt-3 space-y-1">
        {steps.map((st) => {
          const inner = (
            <>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", st.done ? "bg-teal-600 text-white" : "bg-paper text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
                {st.done ? <Check className="h-4 w-4" aria-hidden /> : <st.icon className="h-4 w-4" />}
              </span>
              <span className={cn("flex-1 text-[15px] font-semibold", st.done ? "text-slate-500 line-through dark:text-slate-400" : "text-blue-900 dark:text-white")}>{st.label}</span>
            </>
          );
          const cls = "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-paper dark:hover:bg-slate-800";
          return (
            <li key={st.key}>
              {st.href ? (
                <a href={st.href} target="_blank" rel="noopener noreferrer" onClick={st.run} className={cls}>
                  {inner}
                </a>
              ) : (
                <button type="button" onClick={st.run} className={cls}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
