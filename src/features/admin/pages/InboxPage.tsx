/* Inbox: student chats (app + website) and website contact messages. */
import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCheck, Inbox, Mail, MailOpen, Send, Trash2 } from "lucide-react";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import {
  getInboxActivityMs,
  getInboxDisplayName,
  getInboxEmail,
  getInboxMessageBody,
  getInboxPreview,
  isUnreadLearnerChat,
  toDateMs,
} from "../lib";
import { AdminPage, CopyButton, EmptyHint, OverflowMenu, Panel, Pill, Segmented, Spinner, relativeTime } from "../ui";

type Tab = "students" | "website";
type ChatFilter = "all" | "new" | "resolved";

const ListItem: React.FC<{
  active: boolean;
  unread: boolean;
  name: string;
  preview: string;
  when: number;
  meta?: string;
  onClick: () => void;
}> = ({ active, unread, name, preview, when, meta, onClick }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition",
        active ? "bg-teal-50 dark:bg-teal-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          unread ? "bg-orange-500" : "bg-transparent",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200")}>
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(when)}</span>
        </span>
        {meta ? <span className="block truncate text-xs text-teal-700 dark:text-teal-400">{meta}</span> : null}
        <span className="mt-0.5 block truncate text-sm text-slate-500 dark:text-slate-400">{preview}</span>
      </span>
    </button>
  </li>
);

const StudentChat: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    selectedInboxMessage,
    inboxThread,
    inboxThreadLoading,
    replyDraft,
    setReplyDraft,
    replyError,
    replyBusy,
    sendInboxReply,
    markInboxStatus,
    deleteInboxMessage,
  } = useAdmin();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [inboxThread.length, selectedInboxMessage?.id]);

  if (!selectedInboxMessage) {
    return <EmptyHint icon={<Inbox className="h-5 w-5" />} title="Pick a conversation" />;
  }
  const m: any = selectedInboxMessage;
  const status = String(m.status || "new").toLowerCase();
  const context = m.sessionTitle || m.pathTitle || m.cohortLabel || "";

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800 sm:px-4">
        <button type="button" onClick={onBack} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Back to conversations">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{getInboxDisplayName(m)}</p>
          <p className="truncate text-xs text-slate-500">{[getInboxEmail(m), context].filter(Boolean).join(" · ")}</p>
        </div>
        {status === "resolved" ? <Pill tone="success">Done</Pill> : null}
        <OverflowMenu
          items={[
            status === "resolved"
              ? { label: "Mark as needs reply", icon: <MailOpen className="h-4 w-4" />, onSelect: () => markInboxStatus(m.id, "new") }
              : { label: "Mark as done", icon: <CheckCheck className="h-4 w-4" />, onSelect: () => markInboxStatus(m.id, "resolved") },
            { label: "Delete conversation", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deleteInboxMessage(m.id) },
          ]}
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-3 py-4 dark:bg-slate-950/40 sm:px-4 lg:max-h-[55vh]">
        {inboxThreadLoading && inboxThread.length === 0 ? (
          <Spinner label="Loading conversation" />
        ) : inboxThread.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{getInboxPreview(m)}</p>
        ) : (
          inboxThread.map((msg) => {
            const mine = msg.senderType === "admin";
            return (
              <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                    mine
                      ? "rounded-br-md bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950"
                      : "rounded-bl-md bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={cn("mt-1 text-[11px]", mine ? "text-white/70 dark:text-slate-900/70" : "text-slate-400")}>
                    {mine ? "You" : msg.senderName} · {relativeTime(toDateMs(msg.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-slate-100 p-3 dark:border-slate-800 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendInboxReply();
        }}
      >
        <label htmlFor="reply" className="sr-only">Reply</label>
        <textarea
          id="reply"
          rows={3}
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              sendInboxReply();
            }
          }}
          placeholder="Write a reply. The student sees it in the app and on the website."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {replyError ? <p className="mt-1 text-xs font-semibold text-red-600">{replyError}</p> : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="hidden text-xs text-slate-400 sm:inline">Ctrl + Enter to send · sending marks it done</span>
          <Button type="submit" size="sm" loading={replyBusy} leftIcon={<Send className="h-4 w-4" />} className="ml-auto">
            Send reply
          </Button>
        </div>
      </form>
    </div>
  );
};

const WebsiteMessage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { selectedSupportMessage, markSupportStatus, deleteSupportMessage } = useAdmin();
  if (!selectedSupportMessage) {
    return <EmptyHint icon={<Mail className="h-5 w-5" />} title="Pick a message" />;
  }
  const m: any = selectedSupportMessage;
  const email = getInboxEmail(m);
  const status = String(m.status || "new").toLowerCase();
  const subject = encodeURIComponent("Re: your message to Code with Gideon");
  const quoted = encodeURIComponent(`\n\n---\nYou wrote:\n${getInboxMessageBody(m)}`);
  // Website enquiries from /hire carry a WhatsApp number instead of an email.
  const wa = String(m.whatsapp || "").replace(/\D/g, "");
  const firstName = String(getInboxDisplayName(m) || "").split(" ")[0];
  const waText = encodeURIComponent(
    `Hi ${firstName}, it's Gideon from Code with Gideon. Thanks for your enquiry${m.businessName ? ` about a website for ${m.businessName}` : ""}.`,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800 sm:px-4">
        <button type="button" onClick={onBack} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Back to messages">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{getInboxDisplayName(m)}</p>
          <p className="truncate text-xs text-slate-500">
            {email || (wa ? `WhatsApp +${wa}` : "")} · {new Date(getInboxActivityMs(m) || toDateMs(m.createdAt)).toLocaleString()}
          </p>
        </div>
        {status === "resolved" ? <Pill tone="success">Done</Pill> : null}
        <OverflowMenu
          items={[
            status === "resolved"
              ? { label: "Mark as new", icon: <MailOpen className="h-4 w-4" />, onSelect: () => markSupportStatus(m.id, "new") }
              : { label: "Mark as done", icon: <CheckCheck className="h-4 w-4" />, onSelect: () => markSupportStatus(m.id, "resolved") },
            { label: "Delete message", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deleteSupportMessage(m.id) },
          ]}
        />
      </div>
      <div className="flex-1 px-4 py-4">
        {m.topic || m.category ? <Pill tone="navy" className="mb-3">{m.topic || m.category}</Pill> : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-100">{getInboxMessageBody(m)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {email ? (
          <a
            href={`mailto:${email}?subject=${subject}&body=${quoted}`}
            onClick={() => markSupportStatus(m.id, "resolved")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 text-sm font-bold text-white hover:bg-blue-800 dark:bg-teal-500 dark:text-slate-950"
          >
            <Send className="h-4 w-4" aria-hidden /> Reply by email
          </a>
        ) : null}
        {email ? <CopyButton text={email} label="Copy email" /> : null}
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => markSupportStatus(m.id, "resolved")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 text-sm font-bold text-blue-950 hover:bg-orange-400"
          >
            <Send className="h-4 w-4" aria-hidden /> Reply on WhatsApp
          </a>
        ) : null}
        {wa ? <CopyButton text={`+${wa}`} label="Copy number" /> : null}
      </div>
    </div>
  );
};

const InboxPage: React.FC = () => {
  const {
    inboxMessages,
    inboxLoading,
    inboxError,
    filteredInboxMessages,
    inboxFilter,
    setInboxFilter,
    inboxCounts,
    selectedInboxId,
    setSelectedInboxId,
    markInboxStatus,
    supportMessages,
    supportLoading,
    supportError,
    filteredSupportMessages,
    supportFilter,
    setSupportFilter,
    supportCounts,
    selectedSupportId,
    setSelectedSupportId,
    unreadInboxCount,
    unreadSupportCount,
  } = useAdmin();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "website" ? "website" : "students";
  const openId = params.get("thread") || "";

  // Deep link (e.g. from a student's panel) selects that conversation.
  useEffect(() => {
    if (!openId) return;
    if (tab === "students" && inboxMessages.some((m) => m.id === openId)) {
      setInboxFilter("all");
      setSelectedInboxId(openId);
    }
    if (tab === "website" && supportMessages.some((m) => m.id === openId)) {
      setSupportFilter("all");
      setSelectedSupportId(openId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, tab, inboxMessages.length, supportMessages.length]);

  const setParam = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
  };

  const openChat = (m: any) => {
    setSelectedInboxId(m.id);
    if (isUnreadLearnerChat(m)) markInboxStatus(m.id, "read");
    setParam({ thread: m.id });
  };
  const openSupport = (m: any) => {
    setSelectedSupportId(m.id);
    setParam({ thread: m.id });
  };
  const back = () => setParam({ thread: "" });

  const chatFilter: ChatFilter = inboxFilter === "new" || inboxFilter === "resolved" ? inboxFilter : "all";
  const siteFilter: ChatFilter = supportFilter === "new" || supportFilter === "resolved" ? supportFilter : "all";

  const list =
    tab === "students" ? (
      inboxLoading && inboxMessages.length === 0 ? (
        <Spinner label="Loading chats" />
      ) : inboxError ? (
        <p className="px-4 py-6 text-sm text-red-600">{inboxError}</p>
      ) : filteredInboxMessages.length === 0 ? (
        <EmptyHint icon={<Inbox className="h-5 w-5" />} title={chatFilter === "new" ? "No chats need a reply" : "No chats here"} />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredInboxMessages.map((m: any) => (
            <ListItem
              key={m.id}
              active={m.id === selectedInboxId}
              unread={isUnreadLearnerChat(m)}
              name={getInboxDisplayName(m)}
              preview={getInboxPreview(m)}
              when={getInboxActivityMs(m)}
              meta={m.sessionTitle || m.pathTitle || ""}
              onClick={() => openChat(m)}
            />
          ))}
        </ul>
      )
    ) : supportLoading && supportMessages.length === 0 ? (
      <Spinner label="Loading messages" />
    ) : supportError ? (
      <p className="px-4 py-6 text-sm text-red-600">{supportError}</p>
    ) : filteredSupportMessages.length === 0 ? (
      <EmptyHint icon={<Mail className="h-5 w-5" />} title="No messages here" />
    ) : (
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredSupportMessages.map((m: any) => (
          <ListItem
            key={m.id}
            active={m.id === selectedSupportId}
            unread={String(m.status || "new").toLowerCase() === "new"}
            name={getInboxDisplayName(m)}
            preview={getInboxPreview(m)}
            when={getInboxActivityMs(m) || toDateMs(m.createdAt)}
            meta={m.topic || ""}
            onClick={() => openSupport(m)}
          />
        ))}
      </ul>
    );

  return (
    <AdminPage title="Inbox" description="Student questions from the app and website, and messages from the contact form.">
      <Segmented<Tab>
        label="Inbox"
        value={tab}
        onChange={(v) => setParam({ tab: v === "students" ? "" : v, thread: "" })}
        options={[
          { value: "students", label: "Student chats", count: unreadInboxCount },
          { value: "website", label: "Website messages", count: unreadSupportCount },
        ]}
      />

      <Panel padded={false} className="overflow-hidden">
        <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className={cn("border-slate-100 dark:border-slate-800 lg:border-r", openId ? "hidden lg:block" : "block")}>
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <Segmented<ChatFilter>
                label="Filter"
                value={tab === "students" ? chatFilter : siteFilter}
                onChange={(v) => (tab === "students" ? setInboxFilter(v) : setSupportFilter(v))}
                options={
                  tab === "students"
                    ? [
                        { value: "new", label: "Needs reply", count: inboxCounts.new },
                        { value: "all", label: "All", count: inboxCounts.all },
                        { value: "resolved", label: "Done", count: inboxCounts.resolved },
                      ]
                    : [
                        { value: "new", label: "New", count: supportCounts.new },
                        { value: "all", label: "All", count: supportCounts.all },
                        { value: "resolved", label: "Done", count: supportCounts.resolved },
                      ]
                }
              />
            </div>
            <div className="lg:max-h-[70vh] lg:overflow-y-auto">{list}</div>
          </div>
          <div className={cn(openId ? "block" : "hidden lg:block")}>
            {tab === "students" ? <StudentChat onBack={back} /> : <WebsiteMessage onBack={back} />}
          </div>
        </div>
      </Panel>
    </AdminPage>
  );
};

export default InboxPage;
