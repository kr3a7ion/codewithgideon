import React from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Phone,
  PlayCircle,
  TimerReset,
  Users,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Skeleton } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { SessionCard } from "../components/SessionCard";
import { StatTile } from "../components/StatTile";
import { LockedNotice } from "../components/LockedNotice";
import { SessionTags } from "../components/SessionTags";
import { formatNaira, formatSessionTime, openExternal } from "../lib";

const Overview: React.FC = () => {
  const s = useStudent();
  const profile = s.profile!;
  const hero = s.liveSession || s.nextSession || s.latestSession;
  const heroLabel = s.liveSession
    ? "Live now"
    : s.nextSession
      ? "Next class"
      : s.latestSession
        ? "Latest class"
        : "Classes";
  const joinUrl = s.liveSession?.joinUrl || s.nextSession?.joinUrl || "";

  return (
    <div className="space-y-6">
      {s.isLocked ? (
        <LockedNotice
          title="Your payment isn't complete yet"
          body="Finish your payment to unlock your class schedule, recordings, resources and mentor chat."
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Progress"
          icon={<BadgeCheck className="h-4 w-4" />}
          value={`${Math.round(s.progressPercent)}%`}
          hint={`${s.paidWeeks} of ${s.totalProgramWeeks} weeks`}
          loading={s.courseLoading}
        />
        <StatTile
          label="Weeks left"
          icon={<TimerReset className="h-4 w-4" />}
          value={s.remainingWeeks}
          hint="to finish the course"
          loading={s.courseLoading}
        />
        <StatTile
          label="Classes"
          icon={<BookOpen className="h-4 w-4" />}
          value={s.isLocked ? 0 : s.sessions.length}
          hint="unlocked so far"
          loading={s.sessionsLoading}
        />
        <StatTile
          label="Status"
          icon={s.isLocked ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          value={s.isLocked ? "Pending" : "Active"}
          hint={s.hasPendingTopUp ? "top-up in progress" : s.isLocked ? "awaiting payment" : "enrolled"}
          loading={s.courseLoading || s.cohortLoading}
        />
      </div>

      {/* DOM order is spotlight, plan, classes so phones see the plan
          before the class list; on desktop the plan sits in the right column. */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* Class spotlight */}
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* "Live now" is shown by the session tags below. */}
              {!s.liveSession ? <Badge tone="teal">{heroLabel}</Badge> : null}
              {!s.isLocked && s.sessions.length > 0 ? (
                <Badge tone="slate">
                  {s.sessions.length} class{s.sessions.length === 1 ? "" : "es"} unlocked
                </Badge>
              ) : null}
            </div>

            {s.sessionsLoading ? (
              <div className="mt-5 space-y-3">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : s.isLocked ? (
              <p className="mt-5 text-slate-600 dark:text-slate-300">
                Your classes appear here as soon as your payment is confirmed.
              </p>
            ) : hero ? (
              <div className="mt-5">
                <h2 className="text-2xl font-bold text-blue-900 dark:text-white">
                  Week {hero.week}: {hero.title}
                </h2>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CalendarDays className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden />
                  {formatSessionTime(hero)}
                </p>
                <SessionTags session={hero} />
                {hero.notes ? (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                    {hero.notes}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  {joinUrl ? (
                    <Button onClick={() => openExternal(joinUrl)} leftIcon={<PlayCircle className="h-4 w-4" />}>
                      {s.liveSession ? "Join live class" : "Open next class"}
                    </Button>
                  ) : null}
                  <Button variant="secondary" onClick={() => s.goTo("classes")} rightIcon={<ArrowRight className="h-4 w-4" />}>
                    All classes
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                className="mt-5"
                icon={<BookOpen className="h-6 w-6" />}
                title="No classes published yet"
                description="Your cohort is active. Classes appear here automatically once they're scheduled."
              />
            )}
          </Card>

          {/* Plan */}
          <div className="space-y-6 lg:col-start-3 lg:row-span-2 lg:row-start-1">
                      <Card>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your course
            </p>
            <h2 className="mt-2 text-xl font-bold text-blue-900 dark:text-white">{profile.path}</h2>

            <div className="mt-5">
              <div className="flex items-end justify-between text-sm">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Weeks paid</span>
                <span className="font-display font-bold text-blue-900 dark:text-white">
                  {s.paidWeeks} / {s.totalProgramWeeks}
                </span>
              </div>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(s.progressPercent)}
                aria-label="Course weeks paid"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-900 transition-[width] duration-700"
                  style={{ width: `${s.progressPercent}%` }}
                />
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Users className="h-4 w-4" aria-hidden /> Cohort
                </dt>
                <dd className="text-right font-semibold text-blue-900 dark:text-slate-100">
                  {s.cohortLoading ? <Skeleton className="h-4 w-24" /> : s.cohortLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CreditCard className="h-4 w-4" aria-hidden /> Price
                </dt>
                <dd className="font-semibold text-blue-900 dark:text-slate-100">
                  {s.hasCoursePricing ? `${formatNaira(s.weeklyRate)} / week` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone className="h-4 w-4" aria-hidden /> Phone
                </dt>
                <dd className="font-semibold text-blue-900 dark:text-slate-100">{profile.phone}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4" aria-hidden /> Joined
                </dt>
                <dd className="font-semibold text-blue-900 dark:text-slate-100">
                  {new Date(profile.timestamp || Date.now()).toLocaleDateString()}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
              {s.isLocked ? (
                <Button variant="accent" fullWidth onClick={s.continuePayment} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Complete payment
                </Button>
              ) : !s.hasCoursePricing ? (
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {s.courseError || "We couldn't confirm the course price. Please contact support."}
                </p>
              ) : s.canTopUp ? (
                <>
                  <Button fullWidth onClick={s.openTopUp} rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Add more weeks
                  </Button>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    {formatNaira(s.remainingWeeks * s.weeklyRate)} pays for the rest of the course
                  </p>
                </>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> You've paid for the full course
                </p>
              )}
            </div>
          </Card>

          {s.pendingPayment ? (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                <AlertCircle className="h-4 w-4" aria-hidden />
                {s.pendingPayment.kind === "topup" ? "Top-up in progress" : "Payment in progress"}
              </p>
              <p className="mt-3 text-sm font-semibold text-orange-900 dark:text-orange-100">
                {s.pendingPayment.weeks} week(s) · {formatNaira(Number(s.pendingPayment.amount))}
              </p>
              <p className="mt-2 text-xs text-orange-900/80 dark:text-orange-100/80">
                If you already paid, this clears automatically once Paystack confirms it.
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-orange-900/70 dark:text-orange-100/70">
                {s.pendingPayment.reference}
              </p>
            </Card>
          ) : null}
          </div>

          {!s.isLocked && s.sessions.length > 1 ? (
            <section aria-labelledby="upcoming-title" className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="upcoming-title" className="text-lg font-bold text-blue-900 dark:text-white">
                  Your classes
                </h2>
                <button
                  onClick={() => s.goTo("classes")}
                  className="text-sm font-bold text-teal-600 hover:underline dark:text-teal-300"
                >
                  See all
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {s.sessions.slice(0, 4).map((session) => (
                  <SessionCard key={session.id} session={session} compact />
                ))}
              </div>
            </section>
          ) : null}
      </div>
    </div>
  );
};

export default Overview;
