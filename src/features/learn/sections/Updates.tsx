import React from "react";
import { ArrowRight, Bell, CheckCheck, ExternalLink } from "lucide-react";
import type { CohortMessageDoc } from "../../../../services/registrationStore";
import { mbtn } from "../../../marketing/ui";
import { Avatar, GroupLabel, Notice } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { ago } from "../time";
import { EmptyCard, UpdateRow } from "../ui";

/** Updates (/student/notifications): announcements and mentor replies. */
const Updates: React.FC = () => {
  const s = useStudent();
  const reply = s.lastMentorReply;
  const fresh = s.cohortMessages.filter((m) => s.isMessageUnread(m));
  const earlier = s.cohortMessages.filter((m) => !s.isMessageUnread(m));
  const anythingUnread = fresh.length > 0 || s.hasUnreadMentorReply;

  const row = (m: CohortMessageDoc, unread: boolean) => (
    <UpdateRow
      key={m.id}
      title={m.title}
      body={m.body}
      time={ago((m as any).sentAt || (m as any).createdAt)}
      unread={unread}
      action={
        m.ctaUrl || unread ? (
          <>
            {m.ctaUrl ? (
              <a
                href={m.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void s.markCohortMessageRead(m)}
                className={mbtn({ kind: "secondary", size: "sm" })}
              >
                {m.ctaLabel || "Open link"} <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
            {unread ? (
              <button type="button" onClick={() => void s.markCohortMessageRead(m)} className="px-1 text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">
                Mark as read<span className="sr-only">: {m.title}</span>
              </button>
            ) : null}
          </>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader
        title="Updates"
        description="Announcements from Gideon and reminders before each class."
        actions={
          <button
            type="button"
            disabled={!anythingUnread}
            onClick={() => void s.markEverythingRead()}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-blue-900 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline dark:text-white dark:disabled:text-slate-500"
          >
            <CheckCheck className="h-[18px] w-[18px]" aria-hidden /> Mark all as read
          </button>
        }
      />

      <div className="max-w-[760px] space-y-6">
        {s.notificationError ? <Notice tone="error">{s.notificationError}</Notice> : null}

        {reply && s.hasUnreadMentorReply ? (
          <div className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-teal-600/40 bg-teal-50 p-4 dark:border-teal-400/40 dark:bg-teal-950/60 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name="Gideon" size={36} tone="teal" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-blue-900 dark:text-white">{reply.senderName || "Gideon"} replied in Mentor chat</p>
                <p className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">“{reply.body}”</p>
              </div>
            </div>
            <button type="button" onClick={() => s.goTo("chat")} className={mbtn({ kind: "learn", className: "self-start sm:self-auto" })}>
              Open chat <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        ) : null}

        {s.cohortMessagesLoading ? (
          <div className="space-y-2.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ))}
          </div>
        ) : !s.cohortMessages.length ? (
          <EmptyCard icon={Bell} title="You're all caught up">
            Announcements from Gideon and class reminders show here and in the app.
          </EmptyCard>
        ) : (
          <>
            {fresh.length ? (
              <section aria-labelledby="updates-new" className="space-y-3">
                <GroupLabel as="h2">
                  <span id="updates-new">New</span>
                </GroupLabel>
                <ul className="space-y-2.5">{fresh.map((m) => row(m, true))}</ul>
              </section>
            ) : null}
            {earlier.length ? (
              <section aria-labelledby="updates-earlier" className="space-y-3">
                <GroupLabel as="h2">
                  <span id="updates-earlier">{fresh.length ? "Earlier" : "All updates"}</span>
                </GroupLabel>
                <ul className="space-y-2.5">{earlier.map((m) => row(m, false))}</ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default Updates;
