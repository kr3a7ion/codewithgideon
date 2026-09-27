/* Announcements: send a message to everyone in a cohort. */
import React from "react";
import { BellRing, Megaphone, Pencil, Send, Trash2, Zap } from "lucide-react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { toDateMs } from "../lib";
import { AdminPage, EmptyHint, OverflowMenu, Panel, Pill, Spinner, relativeTime } from "../ui";

const AnnouncementsPage: React.FC = () => {
  const {
    cohorts,
    paths,
    selectedCohortId,
    setSelectedCohortId,
    cohortMessages,
    messagesLoading,
    messageForm,
    setMessageForm,
    messageError,
    editingMessageId,
    sendMessageToCohort,
    updateMessage,
    startEditMessage,
    cancelEditMessage,
    deleteMessage,
    busy,
    messageBusyId,
    activeByPath,
  } = useAdmin();

  const cohort = cohorts.find((c) => c.id === selectedCohortId);
  const openKeys = new Set(Object.values(activeByPath).map((a) => String(a?.cohortKey || "")));
  const set = (patch: Partial<typeof messageForm>) => setMessageForm((f) => ({ ...f, ...patch }));

  return (
    <AdminPage
      title="Announcements"
      description="Messages for everyone in a cohort. Students see them in the app and on the website under Notifications."
    >
      <div className="sm:w-96">
        <label htmlFor="ann-cohort" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Cohort</label>
        <select
          id="ann-cohort"
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {paths.map((p) => {
            const list = cohorts.filter((c) => String((c as any).pathId || "") === p.id);
            if (!list.length) return null;
            return (
              <optgroup key={p.id} label={p.title}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}{openKeys.has(c.id) ? " (open intake)" : ""}
                  </option>
                ))}
              </optgroup>
            );
          })}
          {cohorts
            .filter((c) => !paths.some((p) => p.id === String((c as any).pathId || "")))
            .map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
        <Panel
          title={editingMessageId ? "Edit announcement" : "New announcement"}
          description={cohort ? `To everyone in ${cohort.label}` : undefined}
        >
          <form onSubmit={editingMessageId ? updateMessage : sendMessageToCohort} className="space-y-4">
            <Field label="Title" htmlFor="ann-title">
              <input id="ann-title" value={messageForm.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Class moved to 7pm this Thursday" className={inputClass} />
            </Field>
            <Field label="Message" htmlFor="ann-body">
              <textarea id="ann-body" rows={5} value={messageForm.body} onChange={(e) => set({ body: e.target.value })} className={inputClass} />
            </Field>
            <details className="rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">Add a button (optional)</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Button text" htmlFor="ann-cta">
                  <input id="ann-cta" value={messageForm.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder="Watch recording" className={inputClass} />
                </Field>
                <Field label="Button link" htmlFor="ann-url">
                  <input id="ann-url" type="url" value={messageForm.ctaUrl} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder="https://..." className={inputClass} />
                </Field>
              </div>
            </details>
            {messageError ? <p className="text-sm font-semibold text-red-600">{messageError}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                loading={editingMessageId ? messageBusyId === editingMessageId : !!busy.sendCohortMessage}
                leftIcon={<Send className="h-4 w-4" />}
                disabled={!cohort}
              >
                {editingMessageId ? "Save changes" : "Send announcement"}
              </Button>
              {editingMessageId ? (
                <Button variant="secondary" onClick={cancelEditMessage}>Cancel</Button>
              ) : null}
            </div>
          </form>
        </Panel>

        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm dark:border-teal-500/30 dark:bg-teal-500/10">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300" aria-hidden />
            <p className="text-teal-900 dark:text-teal-100">
              Class reminders are sent automatically about an hour before every published class. You don't need to post them yourself.
            </p>
          </div>

          <Panel title="Sent" padded={false}>
            {messagesLoading && cohortMessages.length === 0 ? (
              <Spinner label="Loading announcements" />
            ) : cohortMessages.length === 0 ? (
              <EmptyHint icon={<Megaphone className="h-5 w-5" />} title="Nothing sent to this cohort yet" />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {cohortMessages.map((m: any) => (
                  <li key={m.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {m.title}
                        {m.sentBy === "automation" ? (
                          <Pill tone="teal"><BellRing className="h-3 w-3" aria-hidden /> Automatic</Pill>
                        ) : null}
                      </p>
                      <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{m.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{relativeTime(Number(m.createdAt) || toDateMs(m.sentAt))}</p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => startEditMessage(m)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label={`Edit ${m.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <OverflowMenu
                        items={[{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deleteMessage(m.id) }]}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
};

export default AnnouncementsPage;
