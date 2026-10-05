import React from "react";
import { cn } from "../../../ui";
import { Progress } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { clamp, getBadgesForLength } from "../lib";

const Badges: React.FC = () => {
  const s = useStudent();
  const milestones = getBadgesForLength(s.totalProgramWeeks);
  const earned = clamp(s.paidWeeks, 0, milestones.length);
  const current = milestones[Math.max(0, Math.min(earned || 1, milestones.length) - 1)] || milestones[0];

  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader title="Badges" description="One badge for every week of your course, the same as in the app." />

      <section
        aria-label="Your latest badge"
        className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={{ background: `radial-gradient(circle at 85% 0%, ${current.color}55, transparent 45%), linear-gradient(135deg, #0F2B5B, #136B72)` }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-6xl leading-none" aria-hidden>
              {earned ? current.badge : "🌱"}
            </div>
            <h2 className="mt-4 font-display text-[28px] font-bold leading-9">{earned ? current.title : "Your first badge is waiting"}</h2>
            <p className="mt-1.5 max-w-md text-[15px] font-medium leading-6 text-white/85">
              {earned ? current.tagline : "Unlock your first week to earn your first badge."}
            </p>
          </div>
          <div className="min-w-[180px] rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-white/75">Earned</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {earned} of {milestones.length}
            </p>
            <Progress value={earned} max={milestones.length} label="Badges earned" className="mt-3" track="bg-white/20" />
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {milestones.map((badge) => {
          const isEarned = badge.week <= earned;
          return (
            <li
              key={`${badge.week}-${badge.title}`}
              className={cn(
                "relative overflow-hidden rounded-[18px] p-4",
                isEarned ? "border border-line bg-white dark:border-line-dark dark:bg-slate-900" : "border border-dashed border-line-strong bg-paper dark:border-slate-700 dark:bg-slate-900/50",
              )}
            >
              {isEarned ? <span className="absolute inset-x-0 top-0 h-1" style={{ background: badge.color }} aria-hidden /> : null}
              <div className={cn("text-3xl", !isEarned && "opacity-40 grayscale")} aria-hidden>
                {badge.badge}
              </div>
              <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Week {badge.week}</p>
              <p className={cn("mt-1 text-[15px] font-bold", isEarned ? "text-blue-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>{badge.title}</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">{isEarned ? badge.tier : "Locked"}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Badges;
