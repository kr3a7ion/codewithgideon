import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Lock, PlayCircle, Send, Users, X } from "lucide-react";
import { mbtn } from "../../../marketing/ui";
import { useContactLinks } from "../../../marketing/useContactLinks";
import { cn } from "../../../ui";
import { Avatar, Card, Notice, naira, Spinner } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { toMs } from "../lib";
import { dayLabel, sessionInfo, timeFmt } from "../time";
import type { MentorChatMessage } from "../useStudentData";

const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const dayName = (ms: number) => {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (dayKey(ms) === dayKey(today.getTime())) return "Today";
  if (dayKey(ms) === dayKey(yesterday.getTime())) return "Yesterday";
  return dayLabel(ms);
};

type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "context"; key: string; label: string }
  | { kind: "message"; key: string; message: MentorChatMessage };

/** Day separators and "You asked about…" pills between messages. */
const buildRows = (messages: MentorChatMessage[]): Row[] => {
  const rows: Row[] = [];
  let lastDay = "";
  let lastContext = "";
  messages.forEach((m) => {
    const ms = toMs(m.createdAt) || 0;
    const day = ms ? dayKey(ms) : "";
    if (day && day !== lastDay) {
      rows.push({ kind: "day", key: `d_${day}`, label: dayName(ms) });
      lastDay = day;
    }
    if (m.senderType === "user" && m.sessionTitle && m.sessionTitle !== lastContext) {
      rows.push({ kind: "context", key: `c_${m.id}`, label: `You asked about ${m.sessionTitle}` });
      lastContext = m.sessionTitle;
    }
    rows.push({ kind: "message", key: m.id, message: m });
  });
  return rows;
};

const MentorChat: React.FC = () => {
  const s = useStudent();
  const { responseTime } = useContactLinks();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locked = s.paymentState !== "active";
  const context = s.chatContext;

  const rows = useMemo(() => buildRows(s.mentorMessages), [s.mentorMessages]);
  const rt = String(responseTime || "").trim().replace(/^(typically|usually)\s+/i, "");
  const replyLine = rt ? `Usually replies ${rt.charAt(0).toLowerCase()}${rt.slice(1)}` : "Usually replies within a few hours";

  // Classes the student can attach to a question, newest first.
  const classOptions = useMemo(
    () =>
      [...s.sessions]
        .map((x) => ({ x, i: sessionInfo(x) }))
        .filter(({ i }) => i.phase !== "upcoming" && i.phase !== "unscheduled")
        .sort((a, b) => b.i.startMs - a.i.startMs)
        .slice(0, 12)
        .map(({ x, i }) => ({ sessionId: String((x as any).id || ""), sessionTitle: `${i.week ? `Week ${i.week} · ` : ""}${i.title}` })),
    [s.sessions],
  );

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows.length]);

  // Arriving from "Ask about this class": put the cursor in the box.
  useEffect(() => {
    if (context) inputRef.current?.focus();
  }, [context]);

  const send = async () => {
    const ok = await s.sendMentorMessage(draft, context);
    if (ok) {
      setDraft("");
      s.setChatContext(null);
    }
  };

  if (locked) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <StudentPageHeader title="Mentor chat" description="Ask Gideon about anything in your classes. Replies come here and in the app." />
        {s.paymentState === "pending" ? (
          <Notice
            tone="pending"
            icon={Lock}
            title="Mentor chat opens with your weeks"
            action={
              <button type="button" onClick={s.continuePayment} className={mbtn({ kind: "learn" })}>
                {s.weeklyRate ? `Pay ${naira(s.intendedWeeks * s.weeklyRate)}` : "Finish payment"}
              </button>
            }
          >
            Once your first payment is confirmed you can ask Gideon about any class.
          </Notice>
        ) : (
          <Notice tone="review" title="Mentor chat opens once your payment is confirmed" role="status">
            We're checking your payment now. You don't need to pay again.
          </Notice>
        )}
      </div>
    );
  }

  return (
    <div className="lg:space-y-6">
      <StudentPageHeader title="Mentor chat" description="Ask Gideon about anything in your classes. Replies come here and in the app." compactOnPhone />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
        <Card
          as="section"
          aria-label="Conversation with Gideon"
          className="-mx-4 flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-none border-x-0 border-t-0 sm:mx-0 sm:h-[calc(100dvh-10rem)] sm:rounded-[20px] sm:border lg:h-[calc(100vh-11rem)] lg:min-h-[520px]"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 dark:border-line-dark sm:px-5">
            <Avatar name="Gideon" size={36} tone="teal" />
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-5 text-blue-900 dark:text-white">Gideon</p>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{replyLine}</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-paper/60 px-4 py-4 dark:bg-slate-950/40 sm:px-5" aria-live="polite" aria-relevant="additions">
            {s.mentorError ? <Notice tone="error">{s.mentorError}</Notice> : null}
            {s.mentorLoading ? (
              <div className="flex justify-center py-10 text-slate-500">
                <Spinner label="Loading messages" className="text-teal-600" />
              </div>
            ) : rows.length === 0 ? (
              <div className="mx-auto max-w-sm py-10 text-center">
                <p className="font-display text-lg font-semibold text-blue-900 dark:text-white">Ask your first question</p>
                <p className="mt-1.5 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                  Say which class it's about, paste the code or error, and what you've tried. You'll get a faster answer.
                </p>
              </div>
            ) : (
              rows.map((row) => {
                if (row.kind === "day")
                  return (
                    <p key={row.key} className="pt-1 text-center text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                      {row.label}
                    </p>
                  );
                if (row.kind === "context")
                  return (
                    <p key={row.key} className="text-center">
                      <span className="inline-block rounded-full bg-paper px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-line dark:bg-slate-800 dark:text-slate-300 dark:ring-line-dark">
                        {row.label}
                      </span>
                    </p>
                  );
                const m = row.message;
                const ms = toMs(m.createdAt);
                if (m.senderType === "system")
                  return (
                    <p key={row.key} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                      {m.body}
                    </p>
                  );
                const mine = m.senderType === "user";
                return (
                  <div key={row.key} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                    {mine ? null : <Avatar name="Gideon" size={28} tone="teal" className="mb-1" />}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-4 py-2.5 text-[15px] leading-[22px] sm:max-w-[75%]",
                        mine
                          ? "rounded-br-md bg-blue-900 text-white dark:bg-teal-600"
                          : "rounded-bl-md border border-line bg-white text-blue-900 dark:border-line-dark dark:bg-slate-900 dark:text-slate-100",
                      )}
                    >
                      {mine ? <span className="sr-only">You: </span> : (
                        <p className="mb-0.5 text-xs font-bold text-teal-700 dark:text-teal-300">{m.senderName || "Gideon"} · Mentor</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      {ms ? <p className={cn("mt-1 text-[11px] font-semibold", mine ? "text-white/70" : "text-slate-500 dark:text-slate-400")}>{timeFmt(ms)}</p> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="border-t border-line bg-white px-3 pb-3 pt-2.5 dark:border-line-dark dark:bg-slate-900 sm:px-5 sm:pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {context ? (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-teal-50 py-1 pl-2.5 pr-1 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                  <PlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">About: {context.sessionTitle}</span>
                  <button
                    type="button"
                    onClick={() => s.setChatContext(null)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-teal-100 dark:hover:bg-teal-900"
                    aria-label="Remove the class from this question"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              ) : classOptions.length ? (
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>About a class?</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const picked = classOptions.find((o) => o.sessionId === e.target.value);
                      if (picked) s.setChatContext(picked);
                    }}
                    className="max-w-[220px] rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-blue-900 dark:border-line-dark dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Choose…</option>
                    {classOptions.map((o) => (
                      <option key={o.sessionId} value={o.sessionId}>
                        {o.sessionTitle}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <label htmlFor="mentor-draft" className="sr-only">
              Message to Gideon
            </label>
            <div className="flex items-end gap-2.5">
              <textarea
                id="mentor-draft"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={3000}
                placeholder="Write your question. Say which part you're stuck on and paste any error."
                className="max-h-40 min-h-[48px] flex-1 resize-y rounded-[14px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-[15px] leading-[22px] text-blue-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={s.mentorSending || draft.trim().length < 5}
                className={mbtn({ kind: "learn", className: "h-12 w-12 shrink-0 !px-0 sm:w-auto sm:!px-5" })}
              >
                {s.mentorSending ? <Spinner /> : <Send className="h-[18px] w-[18px]" aria-hidden />}
                <span className="sr-only sm:not-sr-only">Send</span>
              </button>
            </div>
            <p className="mt-1.5 hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">Text only for now. Ctrl + Enter sends.</p>
          </form>
        </Card>

        <div className="mt-6 hidden space-y-4 lg:mt-0 lg:block">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Get a faster answer</h2>
            <ul className="mt-3 space-y-2.5">
              {["Say which week and class it's about", "Paste the code or the error message", "Tell Gideon what you've already tried"].map((t) => (
                <li key={t} className="flex gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </Card>
          <div className="rounded-[20px] bg-teal-50 p-5 dark:bg-teal-950/60">
            <Users className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
            <h2 className="mt-2 font-display text-lg font-semibold text-blue-900 dark:text-white">Ask your classmates</h2>
            <p className="mt-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">Quick questions often get answered fastest in the student community.</p>
            <button type="button" onClick={() => s.goTo("community")} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">
              Open community <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorChat;
