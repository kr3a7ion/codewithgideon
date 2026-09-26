import React from "react";
import { BellRing, ExternalLink, MessageSquare } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Skeleton, cn } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { formatRelativeDate, openExternal } from "../lib";

const Notifications: React.FC = () => {
  const s = useStudent();
  const meta = s.mentorThreadMeta;

  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Notifications"
        title="Updates from your cohort"
        description="Announcements from your cohort and replies from your mentor."
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={!s.unreadCohortMessages.length}
            onClick={() => void s.markAllCohortMessagesRead()}
          >
            Mark all as read
          </Button>
        }
      />

      {s.notificationError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {s.notificationError}
        </p>
      ) : null}

      {meta?.lastMessage ? (
        <article
          className={cn(
            "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start sm:justify-between",
            s.hasUnreadMentorReply
              ? "border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
          )}
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-blue-900 dark:text-white">
                  {s.hasUnreadMentorReply ? "Your mentor replied" : "Mentor chat"}
                </p>
                {s.hasUnreadMentorReply ? <Badge tone="orange">New</Badge> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                {meta.lastMessagePreview || meta.lastMessage}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {formatRelativeDate(meta.lastMessageAt)}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => s.goTo("chat")} className="shrink-0">
            Open chat
          </Button>
        </article>
      ) : null}

      {s.cohortMessagesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : s.cohortMessages.length === 0 && !meta?.lastMessage ? (
        <EmptyState
          icon={<BellRing className="h-6 w-6" />}
          title="You're all caught up"
          description="Cohort announcements and mentor replies show up here."
        />
      ) : (
        <div className="space-y-3">
          {s.cohortMessages.map((message) => {
            const unread = s.isMessageUnread(message);
            const time = (message as any).sentAt || (message as any).createdAt;
            return (
              <article
                key={message.id}
                className={cn(
                  "rounded-2xl border p-5",
                  unread
                    ? "border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="slate">Announcement</Badge>
                      {unread ? <Badge tone="teal">New</Badge> : null}
                    </div>
                    <h3 className="mt-3 font-bold text-blue-900 dark:text-white">{message.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {message.body}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatRelativeDate(time)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {unread ? (
                      <Button size="sm" variant="secondary" onClick={() => void s.markCohortMessageRead(message)}>
                        Mark as read
                      </Button>
                    ) : null}
                    {message.ctaUrl ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          void s.markCohortMessageRead(message);
                          openExternal(message.ctaUrl);
                        }}
                        rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      >
                        {message.ctaLabel || "Open link"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
