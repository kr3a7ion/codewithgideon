import React from "react";
import { BookOpen, Lock, MessageSquare, PlayCircle, Plus } from "lucide-react";
import { mbtn, Tag, WhatsAppIcon } from "../../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../../marketing/useContactLinks";
import { Avatar, Card, Notice, naira, plural } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { HomeHero } from "../HomeHero";
import { RowsBone } from "../Skeleton";
import { EmptyCard, LockedRow, RecordingCard, ResourceRow, SectionHead, SessionRow, UpdateRow } from "../ui";
import { ago, greeting } from "../time";
import { toMs } from "../lib";

const shortDate = (ms: number) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

/**
 * Home (/student/dashboard). Three states: active (paid), pending (hasn't
 * paid yet) and checking (paid, the admin is confirming it). Locked weeks
 * never show class titles: students can only read the weeks they paid for.
 */
const Home: React.FC = () => {
  const s = useStudent();
  const { whatsapp, nextCohortDate } = useContactLinks();
  const nextCohort = upcomingCohortLabel(nextCohortDate);
  const state = s.paymentState;
  const locked = state !== "active";
  const course = s.courseTitle;

  const heroSession = s.liveSession || s.nextSession;
  const comingUp = s.upcomingSessions.filter((x) => x !== heroSession).slice(0, 2);
  const recordings = s.pastSessions.filter((x) => String((x as any).recordingUrl || "").trim()).slice(0, 3);
  const weekResources = s.resources.filter((r: any) => s.currentWeek && Number(r.sessionWeek) === s.currentWeek);
  const homeResources = (weekResources.length ? weekResources : s.resources).slice(0, 3);
  const updates = s.cohortMessages.slice(0, 2);
  const reply = s.lastMentorReply;
  const review = s.reviewPayment;
  const reviewAmount = review ? review.amountKobo / 100 || review.baseAmount : 0;
  const nextLockedWeek = s.paidWeeks + 1;

  const lockedWeeks = Array.from({ length: Math.min(3, Math.max(1, s.intendedWeeks)) }, (_, i) => i + 1);
  const lockedNote = state === "pending" ? "Unlocks after payment" : "Opens once confirmed";

  // ---- blocks ----
  // Pending and checking are explained in the hero; a top-up being checked
  // gets its own notice because the student can still use their classes.
  const topUpNotice =
    state === "active" && review ? (
      <Notice
        tone="review"
        role="status"
        title="We're confirming your top-up"
        action={
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary" })}>
            Message Gideon <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
        }
      >
        Paystack received {naira(reviewAmount)}
        {review.paidAtMs ? ` on ${shortDate(review.paidAtMs)}` : ""}. Your new weeks unlock once it's confirmed, usually within a few hours. You don't need to pay
        again.
      </Notice>
    ) : null;

  const hero = (
    <HomeHero
      state={state}
      greeting={`${greeting()}${s.firstName ? `, ${s.firstName}` : ""}`}
      courseTitle={course}
      session={heroSession}
      loading={!locked && s.sessionsLoading}
      totalWeeks={s.totalProgramWeeks}
      paidWeeks={s.paidWeeks}
      currentWeek={s.currentWeek}
      completedWeeks={s.completedWeeks}
      intendedWeeks={state === "checking" ? review?.requestedWeeks || s.intendedWeeks : s.intendedWeeks}
      weeklyRate={s.weeklyRate}
      remainingWeeks={s.remainingWeeks}
      hasPastClasses={s.pastSessions.length > 0}
      nextCohort={nextCohort}
      reviewAmount={reviewAmount}
      whatsapp={whatsapp}
      unreadUpdates={s.unreadNotificationCount > 0}
      progressLoading={s.courseWeeksLoading}
      onPay={s.continuePayment}
    />
  );

  const comingUpBlock =
    locked || comingUp.length || s.remainingWeeks > 0 ? (
      <section aria-labelledby="home-coming-up" className="space-y-3">
        <SectionHead title="Coming up" id="home-coming-up" action={locked ? undefined : { label: "All classes", onClick: () => s.goTo("classes") }} />
        <ul className="space-y-2.5">
          {locked
            ? lockedWeeks.map((w) => <LockedRow key={w} title={`Week ${w} classes`} meta="Live with Gideon · recorded" note={lockedNote} />)
            : comingUp.map((x) => <SessionRow key={(x as any).id} session={x} courseTitle={course} />)}
          {!locked && s.remainingWeeks > 0 ? (
            <LockedRow title={`Week ${nextLockedWeek} classes`} meta="Add weeks to unlock" note={`Add week ${nextLockedWeek} to unlock`} />
          ) : null}
        </ul>
      </section>
    ) : null;

  const catchUpBlock = locked ? (
    <section aria-labelledby="home-catch-up" className="space-y-3">
      <SectionHead title="Catch up" id="home-catch-up" />
      <EmptyCard icon={Lock} title="Recordings unlock with your weeks" dashed>
        Every class you've paid for is recorded and shows up here, so you can catch up any time.
      </EmptyCard>
    </section>
  ) : recordings.length ? (
    <section aria-labelledby="home-catch-up" className="space-y-3">
      <SectionHead title="Catch up" id="home-catch-up" action={{ label: "All recordings", onClick: () => s.goTo("classes") }} />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {recordings.map((x) => (
          <RecordingCard key={(x as any).id} session={x} className="w-[230px] shrink-0 snap-start sm:w-auto" />
        ))}
      </div>
    </section>
  ) : s.pastSessions.length ? (
    <section aria-labelledby="home-catch-up" className="space-y-3">
      <SectionHead title="Catch up" id="home-catch-up" />
      <EmptyCard icon={PlayCircle} title="Recordings are on the way">
        Recordings usually go up within a day of each class.
      </EmptyCard>
    </section>
  ) : null;

  const resourcesBlock =
    !locked && homeResources.length ? (
      <section aria-labelledby="home-resources" className="space-y-3">
        <SectionHead
          title={weekResources.length ? "This week's resources" : "Resources"}
          id="home-resources"
          action={{ label: "All resources", onClick: () => s.goTo("resources") }}
        />
        <div className="space-y-2.5">
          {homeResources.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))}
        </div>
      </section>
    ) : null;

  // The hero already shows the weeks; this card is the way to add more.
  const weeksCard =
    state === "active" && !s.courseWeeksLoading ? (
      <Card as="section" aria-labelledby="home-weeks" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="home-weeks" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
            Your weeks
          </h2>
          <Tag tone="learn">{s.remainingWeeks ? "Active" : "Full course"}</Tag>
        </div>
        <p className="mt-2 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
          {s.remainingWeeks
            ? `${plural(s.remainingWeeks, "week")} left to unlock.${s.weeklyRate ? ` ${naira(s.remainingWeeks * s.weeklyRate)} unlocks the rest of the course.` : ""}`
            : "You've unlocked every week of the course."}
        </p>
        {s.canTopUp && !s.topUpInReview ? (
          <button type="button" onClick={s.openTopUp} className={mbtn({ kind: "learn", full: true, className: "mt-4" })}>
            Add weeks <Plus className="h-[18px] w-[18px]" aria-hidden />
          </button>
        ) : null}
      </Card>
    ) : null;

  const mentorCard = (
    <Card as="section" aria-labelledby="home-mentor" className="space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-mentor" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
          {!locked && reply && s.hasUnreadMentorReply ? "Gideon replied" : "Mentor chat"}
        </h2>
        {!locked && s.hasUnreadMentorReply ? <Tag tone="hire">1 new reply</Tag> : null}
      </div>
      {locked ? (
        <>
          <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">Ask Gideon questions about any class once your weeks are unlocked.</p>
          <button type="button" disabled className={mbtn({ kind: "secondary", full: true })}>
            {state === "pending" ? "Opens after payment" : "Opens once confirmed"}
          </button>
        </>
      ) : reply ? (
        <>
          <div className="flex gap-3">
            <Avatar name="Gideon" size={32} tone="teal" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                {reply.senderName || "Gideon"}
                {toMs(reply.createdAt) ? ` · ${ago(reply.createdAt)}` : ""}
              </p>
              <p className="mt-0.5 line-clamp-3 text-sm font-medium leading-[22px] text-blue-900 dark:text-slate-100">{reply.body}</p>
            </div>
          </div>
          <button type="button" onClick={() => s.goTo("chat")} className={mbtn({ kind: "secondary", full: true })}>
            Open chat <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
            Stuck on something? Ask Gideon about any class. Replies come here and in the app.
          </p>
          <button type="button" onClick={() => s.goTo("chat")} className={mbtn({ kind: "secondary", full: true })}>
            Ask a question <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </>
      )}
    </Card>
  );

  const updatesBlock = (
    <section aria-labelledby="home-updates" className="space-y-3">
      <SectionHead title="Updates" id="home-updates" action={{ label: "See all", onClick: () => s.goTo("notifications") }} />
      {s.cohortMessagesLoading ? (
        <RowsBone count={2} kind="item" />
      ) : updates.length ? (
        <ul className="space-y-2.5">
          {updates.map((m) => (
            <UpdateRow key={m.id} title={m.title} body={m.body} time={ago((m as any).sentAt || (m as any).createdAt)} unread={s.isMessageUnread(m)} />
          ))}
        </ul>
      ) : (
        <EmptyCard icon={BookOpen} title="No updates yet">
          Announcements from Gideon show here and in the app.
        </EmptyCard>
      )}
    </section>
  );

  return (
    <div className="space-y-6 lg:space-y-7">
      {hero}
      {topUpNotice}
      {/* Phones: one column, with the weeks card after Coming up. Desktop:
          classes on the left; weeks, mentor and updates on the right. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7">
        <div className="contents lg:flex lg:flex-col lg:gap-8">
          {comingUpBlock ? <div className="order-1">{comingUpBlock}</div> : null}
          {catchUpBlock ? <div className="order-3">{catchUpBlock}</div> : null}
          {resourcesBlock ? <div className="order-4">{resourcesBlock}</div> : null}
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {weeksCard ? <div className="order-2">{weeksCard}</div> : null}
          <div className="order-5">{mentorCard}</div>
          <div className="order-6">{updatesBlock}</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
