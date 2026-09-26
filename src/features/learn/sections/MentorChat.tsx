import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton, cn } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { LockedNotice } from "../components/LockedNotice";
import { formatChatTime } from "../lib";

const MentorChat: React.FC = () => {
  const s = useStudent();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.mentorMessages.length]);

  const send = async () => {
    const ok = await s.sendMentorMessage(draft);
    if (ok) setDraft("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Mentor chat"
        title="Ask your mentor"
        description="Ask about a class, a bug or anything blocking you. Replies arrive here and in the mobile app."
      />

      {s.isLocked ? (
        <LockedNotice
          title="Mentor chat unlocks after payment"
          body="Complete your payment to start a conversation with your mentor."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div
            ref={listRef}
            className="max-h-[60vh] min-h-[320px] space-y-3 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/50 sm:p-6"
            aria-live="polite"
          >
            {s.mentorError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {s.mentorError}
              </p>
            ) : null}

            {s.mentorLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className={cn("h-16", i % 2 ? "mr-16" : "ml-16")} />
              ))
            ) : s.mentorMessages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="Start the conversation"
                description="Be specific: say which class or exercise, what you tried, and what happened."
              />
            ) : (
              s.mentorMessages.map((m) => {
                const fromMentor = m.senderType === "admin";
                return (
                  <div key={m.id} className={cn("flex", fromMentor ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                        fromMentor
                          ? "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          : "rounded-br-md bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1.5 text-[11px] font-semibold",
                          fromMentor ? "text-slate-500 dark:text-slate-400" : "text-white/70 dark:text-slate-900/70",
                        )}
                      >
                        {fromMentor ? m.senderName || "Mentor" : "You"}
                        {formatChatTime(m.createdAt) ? ` · ${formatChatTime(m.createdAt)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="border-t border-slate-200 p-4 dark:border-slate-800 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label htmlFor="mentor-draft" className="sr-only">
              Message to your mentor
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                id="mentor-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={3}
                maxLength={3000}
                placeholder="Type your question…"
                className="min-h-[88px] flex-1 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <Button
                type="submit"
                loading={s.mentorSending}
                disabled={draft.trim().length < 5}
                leftIcon={<Send className="h-4 w-4" />}
                className="sm:min-w-[120px]"
              >
                Send
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ctrl + Enter to send · text only for now
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default MentorChat;
