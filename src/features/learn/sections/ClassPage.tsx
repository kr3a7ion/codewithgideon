import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock3, Lock, MessageSquare, Plus, Video } from "lucide-react";
import type { SessionDoc } from "../../../../services/registrationStore";
import { mbtn, Tag } from "../../../marketing/ui";
import { cn } from "../../../ui";
import { Card, naira, Progress } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { VideoPlayer } from "../VideoPlayer";
import { addToCalendar } from "../calendar";
import { studentSectionRoutes } from "../lib";
import { Bone } from "../Skeleton";
import { sessionInfo } from "../time";
import { EmptyCard, ResourceRow } from "../ui";
import { clock, parseVideo } from "../video";
import { WATCHED_AT } from "../useStudentData";

export const classRoute = (id: string) => `${studentSectionRoutes.classes}/${encodeURIComponent(id)}`;

/** Re-render every `ms` so countdowns and "live now" stay current. */
const useNow = (ms: number) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
};

/** Plain text with clickable links and line breaks. */
const NoteText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/\n/).map((line, li) => (
      <p key={li} className={cn(li && "mt-2")}>
        {line.split(/(https?:\/\/[^\s)]+)/g).map((part, pi) =>
          /^https?:\/\//.test(part) ? (
            <a key={pi} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-bold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">
              {part}
            </a>
          ) : (
            <React.Fragment key={pi}>{part}</React.Fragment>
          ),
        )}
      </p>
    ))}
  </>
);

const countdown = (ms: number) => {
  if (ms <= 0) return "";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60 ? `${m % 60}m` : ""}`.trim();
  return `${Math.round(h / 24)} days`;
};

/**
 * One class (/student/classes/:id): the recording plays here, with notes,
 * the week's resources, and a way to ask Gideon. Before the class it shows
 * the countdown and the join link; during the class, Join.
 */
const ClassPage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const s = useStudent();
  const now = useNow(30_000);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [sessionId]);

  // Every class the student can open, in teaching order, for previous/next.
  const ordered = useMemo(
    () =>
      [...s.sessions].sort((a, b) => {
        const ai = sessionInfo(a);
        const bi = sessionInfo(b);
        return ai.week - bi.week || (ai.hasTime ? ai.startMs : Infinity) - (bi.hasTime ? bi.startMs : Infinity);
      }),
    [s.sessions],
  );
  const index = ordered.findIndex((x) => String((x as any).id) === sessionId);
  const session: SessionDoc | null = index >= 0 ? ordered[index] : null;
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  const back = (
    <Link to={studentSectionRoutes.classes} className="inline-flex h-10 items-center gap-1.5 rounded-xl pr-2 text-sm font-bold text-blue-900 hover:underline dark:text-white">
      <ArrowLeft className="h-4 w-4" aria-hidden /> All classes
    </Link>
  );

  if (s.paymentState !== "active" || (!session && !s.sessionsLoading)) {
    const pending = s.paymentState === "pending";
    const checking = s.paymentState === "checking";
    return (
      <div className="space-y-5">
        {back}
        <EmptyCard
          icon={Lock}
          dashed
          title={pending ? "This class unlocks after payment" : checking ? "This class opens once your payment is confirmed" : "This class isn't in your weeks"}
          action={
            pending ? (
              <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn" })}>
                {s.weeklyRate ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
              </button>
            ) : !checking && s.canTopUp && !s.topUpInReview ? (
              <button type="button" onClick={s.openTopUp} className={mbtn({ kind: "learn" })}>
                Add weeks <Plus className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ) : null
          }
        >
          {pending || checking
            ? "Every class you pay for opens here with its join link, recording and notes."
            : "It may be in a week you haven't unlocked yet, or the class was moved. Your unlocked classes are in All classes."}
        </EmptyCard>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-5" aria-busy="true">
        {back}
        <Bone className="h-4 w-40" onCanvas />
        <Bone className="h-9 w-3/4 rounded-lg" onCanvas />
        <Bone className="aspect-video w-full rounded-[20px]" onCanvas />
      </div>
    );
  }

  const i = sessionInfo(session, now);
  const video = parseVideo(i.recordingUrl);
  const p = s.progress[sessionId];
  const watched = Boolean(p?.completed);
  const resumeAt = p && !p.completed && p.position > 10 && (!p.duration || p.position < p.duration - 15) ? p.position : 0;
  const pct = p?.duration ? Math.min(100, Math.round((p.position / p.duration) * 100)) : 0;
  const weekResources = s.resources.filter(
    (r: any) => String(r.sessionId || "") === sessionId || (i.week > 0 && Number(r.sessionWeek) === i.week && !r.sessionId),
  );
  const sameWeek = ordered.filter((x) => x !== session && sessionInfo(x).week === i.week && i.week > 0);
  const meta = [i.day, i.timeRange || "", i.durationMins ? `${i.durationMins} min` : ""].filter(Boolean).join(" · ");
  const ask = () => s.askAbout({ sessionId, sessionTitle: `${i.week ? `Week ${i.week} · ` : ""}${i.title}` });

  // ---- the main panel changes with the class's phase ----
  let stage: React.ReactNode;
  if (i.phase === "ended" && video) {
    stage = (
      <div className="space-y-3">
        <VideoPlayer
          key={sessionId}
          source={video}
          title={i.title}
          startAt={resumeAt}
          onProgress={(u) => s.saveProgress(sessionId, { position: u.position, duration: u.duration, completed: u.ended ? true : undefined })}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {watched ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 dark:text-teal-300">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Watched
            </span>
          ) : pct > 0 ? (
            <span className="flex min-w-[200px] flex-1 items-center gap-3 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Progress value={pct} max={100} label="Watched so far" className="min-w-[60px] max-w-[220px]" />
              {clock(p!.position)} of {clock(p!.duration)}
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Marked as watched once {Math.round(WATCHED_AT * 100)}% has played.</span>
          )}
          <button
            type="button"
            onClick={() => s.setWatched(sessionId, !watched)}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-blue-900 ring-1 ring-inset ring-line-strong hover:bg-paper dark:text-white dark:ring-slate-600 dark:hover:bg-slate-800"
          >
            {watched ? "Mark as not watched" : (
              <>
                <Check className="h-4 w-4" aria-hidden /> Mark as watched
              </>
            )}
          </button>
        </div>
      </div>
    );
  } else if (i.phase === "ended") {
    stage = (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[20px] bg-blue-900 px-6 text-center text-white">
        <Video className="h-9 w-9 text-teal-300" aria-hidden />
        <p className="font-display text-xl font-bold">{i.recordingSoon ? "The recording is on its way" : "No recording for this class yet"}</p>
        <p className="max-w-md text-[15px] font-medium text-white/80">
          {i.recordingSoon ? "Recordings usually go up within a day of the class. It will play right here." : "Ask Gideon if you missed this class. The recording will play here once it's added."}
        </p>
      </div>
    );
  } else {
    const live = i.phase === "live";
    const left = countdown(i.startMs - now);
    stage = (
      <div className="relative overflow-hidden rounded-[24px] bg-blue-900 px-5 py-7 text-white sm:px-8 sm:py-9">
        <span aria-hidden className="pointer-events-none absolute -bottom-20 right-[-10%] h-56 w-[60%] rounded-full bg-teal-500/25 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold">
            {live ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400 motion-reduce:animate-none" aria-hidden /> Live now
              </>
            ) : i.hasTime ? (
              <>
                <Clock3 className="h-3.5 w-3.5" aria-hidden /> {i.phase === "soon" ? "Starting soon" : "Upcoming class"}
              </>
            ) : (
              "Time to be announced"
            )}
          </span>
          {!live && left ? (
            <p className="mt-4 font-display text-[40px] font-bold leading-none tracking-[-0.02em] sm:text-[52px]">
              {left}
              <span className="ml-2 align-middle text-base font-semibold text-white/70">to go</span>
            </p>
          ) : null}
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] font-semibold text-white/85">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-[18px] w-[18px] text-teal-300" aria-hidden /> {i.day}
            </span>
            {i.timeRange ? (
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-[18px] w-[18px] text-teal-300" aria-hidden /> {i.timeRange}
              </span>
            ) : null}
          </p>
          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {i.canJoin ? (
              <a
                href={i.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-400 px-5 text-[15px] font-bold text-blue-950 hover:bg-teal-300"
              >
                <Video className="h-5 w-5" aria-hidden /> {live ? "Join live class" : "Join class"}
              </a>
            ) : i.hasTime ? (
              <button
                type="button"
                onClick={() => addToCalendar([session], s.courseTitle)}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-[15px] font-bold ring-1 ring-inset ring-white/25 hover:bg-white/15"
              >
                <CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar
              </button>
            ) : null}
            <span className="text-sm font-medium text-white/75">
              {i.canJoin
                ? live
                  ? "Gideon is live now."
                  : "The class starts in a few minutes."
                : i.joinUrl
                  ? "The join link opens 15 minutes before class."
                  : "The join link appears here before class."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const navLink = (x: SessionDoc | null, dir: "prev" | "next") => {
    if (!x) return <span />;
    const xi = sessionInfo(x);
    return (
      <Link
        to={classRoute(String((x as any).id))}
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-line-strong dark:border-line-dark dark:bg-slate-900",
          dir === "next" && "flex-row-reverse text-right",
        )}
      >
        {dir === "prev" ? <ChevronLeft className="h-5 w-5 shrink-0 text-slate-500" aria-hidden /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />}
        <span className="min-w-0">
          <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
            {dir === "prev" ? "Previous" : "Next"}
            {xi.week ? ` · Week ${xi.week}` : ""}
          </span>
          <span className="block truncate text-[15px] font-bold text-blue-900 dark:text-white">{xi.title}</span>
        </span>
      </Link>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {back}
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
          {i.week ? `Week ${i.week}` : "Class"}
          {i.phase === "ended" && video ? " · Recording" : i.phase === "live" ? " · Live" : ""}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-blue-900 dark:text-white lg:text-[32px] lg:leading-10">{i.title}</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 lg:text-[15px]">{meta}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
          {stage}

          {i.notes ? (
            <Card as="section" aria-labelledby="class-notes" className="p-5 sm:p-6">
              <h2 id="class-notes" className="font-display text-lg font-semibold text-blue-900 dark:text-white">
                Notes from Gideon
              </h2>
              <div className="mt-2 text-[15px] font-medium leading-6 text-slate-700 dark:text-slate-200">
                <NoteText text={i.notes} />
              </div>
            </Card>
          ) : null}

          <section aria-labelledby="class-resources" className="space-y-3">
            <h2 id="class-resources" className="font-display text-lg font-semibold text-blue-900 dark:text-white">
              Resources for this class
            </h2>
            {weekResources.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {weekResources.map((r) => (
                  <ResourceRow key={r.id} resource={r} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line-strong px-4 py-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No slides or files for this class yet. Everything Gideon shares is also in{" "}
                <Link to={studentSectionRoutes.resources} className="font-bold text-teal-700 hover:underline dark:text-teal-300">
                  Resources
                </Link>
                .
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Stuck on something?</h2>
            <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">Ask Gideon about this class. Your question is sent with the class name, so the answer comes faster.</p>
            <button type="button" onClick={ask} className={mbtn({ kind: "secondary", full: true })}>
              <MessageSquare className="h-[18px] w-[18px]" aria-hidden /> Ask about this class
            </button>
          </Card>

          {sameWeek.length ? (
            <Card as="section" aria-labelledby="class-week" className="p-5">
              <h2 id="class-week" className="font-display text-lg font-semibold text-blue-900 dark:text-white">
                Also in week {i.week}
              </h2>
              <ul className="mt-3 space-y-1">
                {sameWeek.map((x) => {
                  const xi = sessionInfo(x, now);
                  const xp = s.progress[String((x as any).id)];
                  return (
                    <li key={(x as any).id}>
                      <Link to={classRoute(String((x as any).id))} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-paper dark:hover:bg-slate-800">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-bold text-blue-900 dark:text-white">{xi.title}</span>
                          <span className="block text-[13px] font-medium text-slate-500 dark:text-slate-400">{xi.phase === "ended" ? (xi.recordingUrl ? "Recording" : "Ended") : xi.day}</span>
                        </span>
                        {xp?.completed ? <Tag tone="learn">Watched</Tag> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>

      {prev || next ? (
        <nav aria-label="Other classes" className="flex flex-col gap-3 sm:flex-row">
          {navLink(prev, "prev")}
          {navLink(next, "next")}
        </nav>
      ) : null}
    </div>
  );
};

export default ClassPage;
