import React from "react";
import { PageHeader, cn } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { clamp, getBadgesForLength } from "../lib";

const Badges: React.FC = () => {
  const s = useStudent();
  const milestones = getBadgesForLength(s.totalProgramWeeks);
  const earned = clamp(s.paidWeeks, 0, milestones.length);
  const current = milestones[Math.max(0, Math.min(earned || 1, milestones.length) - 1)] || milestones[0];
  const percent = Math.round((earned / milestones.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Badges"
        title="Your weekly badges"
        description="One badge for every paid week of your course, the same as in the mobile app."
      />

      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={{
          background: `radial-gradient(circle at top right, ${current.color}55, transparent 40%), linear-gradient(135deg, #0F2B5B, #136B72)`,
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-6xl leading-none" aria-hidden>
              {earned ? current.badge : "🌱"}
            </div>
            <h3 className="mt-4 text-3xl font-bold">{earned ? current.title : "Your first badge awaits"}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              {earned ? current.tagline : "Pay for your first week to unlock your first badge."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Earned</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {earned}/{milestones.length}
            </p>
            <p className="text-xs text-white/70">{percent}% of the course</p>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {milestones.map((badge) => {
          const isEarned = badge.week <= earned;
          return (
            <li
              key={`${badge.week}-${badge.title}`}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4",
                isEarned
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-dashed border-slate-300 bg-slate-50 opacity-70 grayscale dark:border-slate-700 dark:bg-slate-900/50",
              )}
            >
              {isEarned ? <span className="absolute inset-x-0 top-0 h-1" style={{ background: badge.color }} /> : null}
              <div className="text-3xl" aria-hidden>
                {badge.badge}
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Week {badge.week}
              </p>
              <p className="mt-1 text-sm font-bold text-blue-900 dark:text-white">{badge.title}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isEarned ? badge.tier : "Locked"}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Badges;
