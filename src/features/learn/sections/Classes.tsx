import React, { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { EmptyState, PageHeader, Skeleton, cn } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { SessionCard } from "../components/SessionCard";
import { LockedNotice } from "../components/LockedNotice";
import { sessionWindow } from "../lib";

type Filter = "all" | "upcoming" | "past";

const Classes: React.FC = () => {
  const s = useStudent();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return s.sessions.filter((session) => {
      if (filter === "all") return true;
      const { endMs } = sessionWindow(session);
      const past = Number.isFinite(endMs) && endMs < now;
      return filter === "past" ? past : !past;
    });
  }, [s.sessions, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Classes"
        title="Your class library"
        description="Live classes and recordings unlock as you pay for more weeks."
      />

      {s.isLocked ? (
        <LockedNotice
          title="Classes unlock after payment"
          body="Complete your payment and your class schedule appears here automatically."
        />
      ) : (
        <>
          <div role="tablist" aria-label="Filter classes" className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(["all", "upcoming", "past"] as Filter[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-bold capitalize transition",
                  filter === key
                    ? "bg-white text-blue-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-blue-900 dark:text-slate-300",
                )}
              >
                {key}
              </button>
            ))}
          </div>

          {s.sessionsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title={s.sessions.length ? "Nothing here" : "No classes published yet"}
              description={
                s.sessions.length
                  ? "Try another filter."
                  : "Once your cohort's classes are scheduled, they show here with the live link and notes."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Classes;
