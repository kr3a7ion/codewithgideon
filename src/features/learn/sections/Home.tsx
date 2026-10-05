import React from "react";
import { BookOpen, Lock, MessageSquare, PlayCircle } from "lucide-react";
import { mbtn, Tag, WhatsAppIcon } from "../../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../../marketing/useContactLinks";
import { Avatar, Card, Notice, naira, plural } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { ClassHero, EmptyCard, LockedRow, RecordingCard, ResourceRow, SectionHead, SessionRow, UpdateRow, WeeksCard } from "../ui";
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
  const notices = (
    <>
      {state === "pending" ? (
        <Notice
          tone="pending"
          title={s.pendingPayment ? "Finish your payment to unlock your classes" : "Pay to unlock your classes"}
          action={
            <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn" })}>
              {s.weeklyRate > 0 ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
            </button>
          }
        >
          You chose {plural(s.intendedWeeks, "week")} of {course}. Classes, recordings and mentor chat open as soon as it's paid.
        </Notice>
      ) : null}
      {review ? (
        <Notice
          tone="review"
          role="status"
          title={state === "checking" ? "We're confirming your payment" : "We're confirming your top-up"}
          action={
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary" })}>
              Message Gideon <WhatsAppIcon className="h-[18px] w-[18px]" />
            </a>
          }
        >
          Paystack received {naira(reviewAmount)}
          {review.paidAtMs ? ` on ${shortDate(review.paidAtMs)}` : ""}. Your {state === "checking" ? "weeks unlock" : "new weeks unlock"} once it's confirmed,
          usually within a few hours. You don't need to pay again.
        </Notice>
      ) : null}
    </>
  );

  const hero = locked ? (
    <ClassHero
      kind="locked"
      lockedLabel={state === "pending" ? "Next live class · locked" : "Next live class · opens soon"}
      lockedTitle="Your first live class is waiting"
      lockedMeta={nextCohort ? `Classes start ${nextCohort}` : undefined}
      lockedNote={state === "pending" ? "Classes open as soon as your first payment is confirmed." : "Your classes open as soon as we confirm your payment."}
    />
  ) : s.sessionsLoading ? (
    <div className="h-[230px] animate-pulse rounded-3xl bg-teal-600/15" aria-hidden />
  ) : heroSession ? (
    <ClassHero kind="class" session={heroSession} totalWeeks={s.totalProgramWeeks} courseTitle={course} />
  ) : s.pastSessions.length && s.remainingWeeks > 0 ? (
    <ClassHero kind="empty" emptyTitle="You're up to date" emptyNote="You've had every class in the weeks you paid for. Add weeks to unlock the next ones." />
  ) : (
    <ClassHero kind="empty" />
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

  const weeksCard = (
    <WeeksCard
      state={state}
      paidWeeks={s.paidWeeks}
      totalWeeks={s.totalProgramWeeks}
      rate={s.weeklyRate}
      intendedWeeks={state === "checking" ? review?.requestedWeeks || s.intendedWeeks : s.intendedWeeks}
      currentWeek={s.currentWeek}
      canTopUp={s.canTopUp && !s.topUpInReview}
      onAddWeeks={s.openTopUp}
      onPay={s.continuePayment}
      checkingNote={review && state === "checking" ? `Paystack received ${naira(reviewAmount)}.` : undefined}
    />
  );

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
        <div className="h-24 animate-pulse rounded-2xl bg-white dark:bg-slate-900" aria-hidden />
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
    <div className="space-y-5 lg:space-y-7">
      <StudentPageHeader
        phoneTitle
        title={`${greeting()}${s.firstName ? `, ${s.firstName}` : ""}`}
        description={[course, s.cohortLabel].filter(Boolean).join(" · ")}
      />
      {notices}
      {/* Phones: one column with the weeks card under the class. Desktop:
          the main column on the left, weeks, mentor and updates on the right. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7">
        <div className="contents lg:flex lg:flex-col lg:gap-8">
          <div className="order-1">{hero}</div>
          {comingUpBlock ? <div className="order-3">{comingUpBlock}</div> : null}
          {catchUpBlock ? <div className="order-4">{catchUpBlock}</div> : null}
          {resourcesBlock ? <div className="order-5">{resourcesBlock}</div> : null}
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-2">{weeksCard}</div>
          <div className="order-6">{mentorCard}</div>
          <div className="order-7">{updatesBlock}</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
