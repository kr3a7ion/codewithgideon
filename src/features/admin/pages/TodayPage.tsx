/* Today: what needs attention, today's classes and key numbers. */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Inbox,
  Mail,
  Radio,
  UserPlus,
  Video,
  Zap,
} from "lucide-react";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { sessionStart, useAdminInsights } from "../insights";
import { AdminPage, CopyButton, Panel, Pill, StatTile, classWhen, naira, relativeTime } from "../ui";
import { toDateMs } from "../lib";
import { RecordingLinkDialog } from "../parts/RecordingLinkDialog";
import type { OverviewSession } from "../useAdminWorkspace";

type Task = {
  key: string;
  icon: React.ReactNode;
  tone: "orange" | "teal" | "navy" | "danger";
  title: string;
  detail: React.ReactNode;
  action: React.ReactNode;
};

const toneClass: Record<Task["tone"], string> = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
  navy: "bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const TodayPage: React.FC = () => {
  const {
    unreadInboxCount,
    unreadSupportCount,
    checkAllPending,
    busy,
    automationStatus,
  } = useAdmin();
  const i = useAdminInsights();
  const navigate = useNavigate();
  const [recordingFor, setRecordingFor] = useState<OverviewSession | null>(null);

  const tasks: Task[] = [];

  if (i.checkoutsToCheck.length) {
    tasks.push({
      key: "checkouts",
      icon: <CreditCard className="h-5 w-5" aria-hidden />,
      tone: "orange",
      title: `${i.checkoutsToCheck.length} unfinished checkout${i.checkoutsToCheck.length === 1 ? "" : "s"}`,
      detail: "Students started paying but the payment wasn't confirmed. Check them with Paystack; paid ones are credited automatically.",
      action: (
        <Button size="sm" onClick={checkAllPending} loading={!!busy.checkAllPending} leftIcon={<Zap className="h-4 w-4" />}>
          Check all with Paystack
        </Button>
      ),
    });
  }
  if (i.needsReview.length) {
    tasks.push({
      key: "review",
      icon: <AlertTriangle className="h-5 w-5" aria-hidden />,
      tone: "danger",
      title: `${i.needsReview.length} payment${i.needsReview.length === 1 ? "" : "s"} need${i.needsReview.length === 1 ? "s" : ""} review`,
      detail: "Paid, but the amount didn't match the course price. Decide whether to credit or refund.",
      action: (
        <Button size="sm" variant="secondary" onClick={() => navigate("/admin/payments")}>
          Review
        </Button>
      ),
    });
  }
  if (unreadInboxCount) {
    tasks.push({
      key: "chats",
      icon: <Inbox className="h-5 w-5" aria-hidden />,
      tone: "navy",
      title: `${unreadInboxCount} unread student chat${unreadInboxCount === 1 ? "" : "s"}`,
      detail: "Questions from students in the app and on the website.",
      action: (
        <Button size="sm" variant="secondary" onClick={() => navigate("/admin/inbox?tab=students")}>
          Reply
        </Button>
      ),
    });
  }
  if (unreadSupportCount) {
    tasks.push({
      key: "support",
      icon: <Mail className="h-5 w-5" aria-hidden />,
      tone: "navy",
      title: `${unreadSupportCount} new website message${unreadSupportCount === 1 ? "" : "s"}`,
      detail: "Sent from the contact form.",
      action: (
        <Button size="sm" variant="secondary" onClick={() => navigate("/admin/inbox?tab=website")}>
          Open
        </Button>
      ),
    });
  }
  if (i.missingRecordings.length) {
    const first = i.missingRecordings[0];
    tasks.push({
      key: "recordings",
      icon: <Video className="h-5 w-5" aria-hidden />,
      tone: "teal",
      title: `${i.missingRecordings.length} past class${i.missingRecordings.length === 1 ? "" : "es"} without a recording`,
      detail: (
        <>
          Latest: <span className="font-semibold">{first.session.title}</span> ({first.cohortLabel}, {classWhen(sessionStart(first))})
        </>
      ),
      action: (
        <Button size="sm" variant="secondary" onClick={() => setRecordingFor(first)}>
          Add recording link
        </Button>
      ),
    });
  }
  i.intakesWithoutClasses.forEach((intake) => {
    tasks.push({
      key: `noclasses-${intake.path.id}`,
      icon: <CalendarPlus className="h-5 w-5" aria-hidden />,
      tone: "teal",
      title: `No upcoming classes for ${intake.path.title}`,
      detail: `${intake.active?.label || intake.cohortKey} is open. Generate its whole schedule from the course syllabus in one go.`,
      action: (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/admin/classes?cohort=${encodeURIComponent(intake.cohortKey)}&generate=1`)}
        >
          Plan classes
        </Button>
      ),
    });
  });
  i.pathsWithoutIntake.forEach((intake) => {
    tasks.push({
      key: `nointake-${intake.path.id}`,
      icon: <UserPlus className="h-5 w-5" aria-hidden />,
      tone: "orange",
      title: `${intake.path.title} has no open intake`,
      detail: "New students who pay for this path won't be placed in a cohort until you start one.",
      action: (
        <Button size="sm" variant="secondary" onClick={() => navigate("/admin/cohorts")}>
          Start intake
        </Button>
      ),
    });
  });

  const reminders = automationStatus.classReminders;
  const paymentsJob = automationStatus.payments;
  const lastPayRun = toDateMs(paymentsJob?.lastRunAt);
  const lastReminderRun = toDateMs(reminders?.lastRunAt);

  return (
    <AdminPage
      title={greeting()}
      description={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
    >
      {i.soon ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-blue-900 p-4 text-white shadow-card dark:bg-teal-500 dark:text-slate-950 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Radio className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold opacity-80">
                {i.liveNow.length ? "Live now" : `Starts ${relativeTime(sessionStart(i.soon))}`} · {i.soon.cohortLabel}
              </p>
              <p className="truncate font-display text-lg font-bold">
                Week {i.soon.session.week}: {i.soon.session.title}
              </p>
            </div>
          </div>
          {(i.soon.session as any).joinUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={(i.soon.session as any).joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-900 hover:bg-slate-100 dark:bg-slate-950 dark:text-white"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> Open class link
              </a>
              <CopyButton text={(i.soon.session as any).joinUrl} label="Copy" className="text-white hover:bg-white/10 hover:text-white dark:text-slate-950 dark:hover:bg-slate-950/10" />
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/classes?cohort=${encodeURIComponent(i.soon!.cohortId)}`)}>
              Add class link
            </Button>
          )}
        </div>
      ) : null}

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Paid students" value={i.paidStudents} onClick={() => navigate("/admin/students?status=paid")} />
        <StatTile
          label="Waiting to pay"
          value={i.pendingStudents}
          tone={i.pendingStudents ? "orange" : "default"}
          onClick={() => navigate("/admin/students?status=pending")}
        />
        <StatTile label="Revenue this month" value={naira(i.revenueThisMonth)} tone="teal" onClick={() => navigate("/admin/payments")} />
        <StatTile label="All-time revenue" value={naira(i.totalRevenue)} onClick={() => navigate("/admin/payments")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        {/* To do */}
        <Panel
          title="Needs your attention"
          description={tasks.length ? `${tasks.length} item${tasks.length === 1 ? "" : "s"}` : undefined}
          padded={false}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8">
              <CheckCircle2 className="h-6 w-6 text-teal-500" aria-hidden />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">You're all caught up</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nothing needs you right now.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((t) => (
                <li key={t.key} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClass[t.tone])}>
                      {t.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t.detail}</p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-[3.25rem] sm:pl-0">{t.action}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5 lg:space-y-6">
          {/* Classes today */}
          <Panel
            title="Today's classes"
            actions={
              <Link to="/admin/classes" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
                Schedule <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
            padded={false}
          >
            {i.todaysClasses.length === 0 ? (
              <div className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400">
                No classes today.
                {i.nextClass ? (
                  <>
                    {" "}Next: <span className="font-semibold text-slate-700 dark:text-slate-200">{i.nextClass.session.title}</span>,{" "}
                    {relativeTime(sessionStart(i.nextClass))} ({i.nextClass.cohortLabel}).
                  </>
                ) : null}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {i.todaysClasses.map((o) => {
                  const live = i.liveNow.some((l) => l.session.id === o.session.id && l.cohortId === o.cohortId);
                  const join = String((o.session as any).joinUrl || "");
                  return (
                    <li key={`${o.cohortId}-${o.session.id}`} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Week {o.session.week}: {o.session.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(sessionStart(o)).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} ·{" "}
                            {o.cohortLabel}
                          </p>
                        </div>
                        {live ? (
                          <Pill tone="danger">
                            <Radio className="h-3 w-3" aria-hidden /> Live
                          </Pill>
                        ) : null}
                      </div>
                      {join ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <a
                            href={join}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 dark:bg-teal-500 dark:text-slate-950"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open class link
                          </a>
                          <CopyButton text={join} label="Copy link" />
                        </div>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">No join link yet</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Automations */}
          <Panel title="Automations" padded>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Zap className={cn("mt-0.5 h-4 w-4 shrink-0", lastPayRun ? "text-teal-500" : "text-slate-400")} aria-hidden />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Payment auto-check</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {lastPayRun
                      ? `Every 30 min · last run ${relativeTime(lastPayRun)}${paymentsJob?.credited ? ` · credited ${paymentsJob.credited}` : ""}`
                      : "Not running yet. Deploy the Cloud Functions to switch it on."}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Zap className={cn("mt-0.5 h-4 w-4 shrink-0", lastReminderRun ? "text-teal-500" : "text-slate-400")} aria-hidden />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Class reminders</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {lastReminderRun
                      ? `About 1 hour before each class · ${Number(reminders?.totalSent || 0)} sent so far`
                      : "Not running yet. Deploy the Cloud Functions to switch it on."}
                  </p>
                </div>
              </li>
            </ul>
          </Panel>

          {/* New sign-ups */}
          {i.newSignups.length ? (
            <Panel
              title="New sign-ups this week"
              actions={
                <Link to="/admin/students?status=pending" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
                  View all
                </Link>
              }
              padded={false}
            >
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {i.newSignups.slice(0, 5).map((r) => (
                  <li key={r.uid}>
                    <Link
                      to={`/admin/students?student=${encodeURIComponent(r.uid)}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.path}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{relativeTime(Number(r.timestamp || 0))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      <RecordingLinkDialog item={recordingFor} onClose={() => setRecordingFor(null)} />
    </AdminPage>
  );
};

export default TodayPage;
