import React, { useMemo, useState } from "react";
import { BookOpen, Lock, Search } from "lucide-react";
import type { ResourceDoc } from "../../../../services/registrationStore";
import { mbtn } from "../../../marketing/ui";
import { cn } from "../../../ui";
import { GroupLabel, naira } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { ItemBone } from "../Skeleton";
import { EmptyCard, ResourceRow } from "../ui";

const weekOf = (r: ResourceDoc) => {
  const w = Number((r as any).sessionWeek);
  return Number.isFinite(w) && w > 0 ? w : 0;
};

const Resources: React.FC = () => {
  const s = useStudent();
  const [query, setQuery] = useState("");
  const [week, setWeek] = useState<number | "all">("all");
  const locked = s.paymentState !== "active";

  const weeks = useMemo(() => {
    const set = new Set(s.resources.map(weekOf));
    return [...set].sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : b - a));
  }, [s.resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return s.resources.filter((r) => {
      if (week !== "all" && weekOf(r) !== week) return false;
      if (!q) return true;
      const anyR = r as any;
      return [anyR.name, anyR.description, anyR.type, anyR.folder].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [s.resources, query, week]);

  const groups = useMemo(() => {
    const map = new Map<number, ResourceDoc[]>();
    filtered.forEach((r) => {
      const w = weekOf(r);
      map.set(w, [...(map.get(w) || []), r]);
    });
    return [...map.entries()].sort(([a], [b]) => (a === 0 ? 1 : b === 0 ? -1 : b - a));
  }, [filtered]);

  const chip = (value: number | "all", label: string) => {
    const on = week === value;
    return (
      <button
        key={String(value)}
        type="button"
        aria-pressed={on}
        onClick={() => setWeek(value)}
        className={cn(
          "h-10 shrink-0 rounded-xl px-3.5 text-sm transition-colors",
          on
            ? "border-2 border-teal-600 bg-teal-50 font-bold text-teal-700 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-200"
            : "border-[1.5px] border-line-strong bg-white font-semibold text-blue-900 hover:border-blue-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white",
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader title="Resources" description="Slides, cheat sheets and starter code for your classes." />

      {locked ? (
        <EmptyCard
          icon={Lock}
          dashed
          title="Resources unlock with your weeks"
          action={
            s.paymentState === "pending" ? (
              <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn" })}>
                {s.weeklyRate ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
              </button>
            ) : null
          }
        >
          {s.paymentState === "pending"
            ? "Each week's slides and starter code show here once your payment is confirmed."
            : "We're confirming your payment. Your resources show here as soon as it's done."}
        </EmptyCard>
      ) : s.resourcesLoading ? (
        <div className="grid gap-3 lg:grid-cols-2" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <ItemBone key={i} />
          ))}
        </div>
      ) : !s.resources.length ? (
        <EmptyCard icon={BookOpen} title="No resources yet">
          Gideon adds slides and starter code for each week. They'll show here and in the app.
        </EmptyCard>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block lg:w-[300px]">
              <span className="sr-only">Search resources</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources"
                className="h-11 w-full rounded-xl border-[1.5px] border-line-strong bg-white pl-10 pr-3 text-[15px] text-blue-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </label>
            {weeks.length > 1 ? (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0" role="group" aria-label="Filter by week">
                {chip("all", "All weeks")}
                {weeks.map((w) => chip(w, w ? `Week ${w}` : "General"))}
              </div>
            ) : null}
          </div>

          {groups.length ? (
            <div className="space-y-6" aria-live="polite">
              {groups.map(([w, list]) => (
                <section key={w} aria-label={w ? `Week ${w}` : "General"} className="space-y-3">
                  <GroupLabel as="h2">{w ? `Week ${w}` : "General"}</GroupLabel>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {list.map((r) => (
                      <ResourceRow key={r.id} resource={r} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyCard icon={Search} title="Nothing matches">
              Try another word, or{" "}
              <button
                type="button"
                className="font-bold text-teal-700 hover:underline dark:text-teal-300"
                onClick={() => {
                  setQuery("");
                  setWeek("all");
                }}
              >
                show everything
              </button>
              .
            </EmptyCard>
          )}
        </>
      )}
    </div>
  );
};

export default Resources;
