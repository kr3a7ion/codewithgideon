/* Updates (announcements): send a message to one cohort, every cohort of a
   course, or every running cohort. Students see them under Updates. */
import React, { useState } from "react";
import { registrationStore } from "../../../../services/registrationStore";
import { BellRing, Megaphone, Pencil, Send, Trash2, Zap } from "lucide-react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { toDateMs } from "../lib";
import { AdminPage, EmptyHint, OverflowMenu, Panel, Pill, Segmented, Spinner, relativeTime } from "../ui";

type Audience = "cohort" | "course" | "all";

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
    notify,
    handleRefreshAll,
  } = useAdmin();
  const [audience, setAudience] = useState<Audience>("cohort");
  const [coursePath, setCoursePath] = useState("");
  const [fanOutBusy, setFanOutBusy] = useState(false);
  const [fanOutError, setFanOutError] = useState("");

  // Running cohorts: not marked finished (Cohort page) and not switched off.
  const running = cohorts.filter((c: any) => c.status !== "finished" && c.isActive !== false);
  const pathForCourse = coursePath || String((cohorts.find((c) => c.id === selectedCohortId) as any)?.pathId || paths[0]?.id || "");
  const targets =
    audience === "all" ? running : audience === "course" ? running.filter((c: any) => c.pathId === pathForCourse) : [];

  const sendToMany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFanOutError("");
    const title = messageForm.title.trim();
    const body = messageForm.body.trim();
    if (title.length < 3) return setFanOutError("Give it a title of at least 3 characters.");
    if (body.length < 5) return setFanOutError("Write a message of at least 5 characters.");
    if (!targets.length) return setFanOutError("There are no running cohorts to send to.");
    setFanOutBusy(true);
    try {
      for (const c of targets) {
        await registrationStore.sendCohortMessage({
          cohortId: c.id,
          cohortLabel: c.label,
          title,
          body,
          ctaLabel: messageForm.ctaLabel.trim(),
          ctaUrl: messageForm.ctaUrl.trim(),
          sentBy: "admin",
        } as any);
      }
      setMessageForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" });
      await handleRefreshAll();
      notify("success", `Sent to ${targets.length} cohort${targets.length === 1 ? "" : "s"}.`);
    } catch (err: any) {
      setFanOutError(err?.message || "Couldn't send to every cohort. Check Sent to see which ones got it.");
    } finally {
      setFanOutBusy(false);
    }
  };

  const cohort = cohorts.find((c) => c.id === selectedCohortId);
  const openKeys = new Set(Object.values(activeByPath).map((a) => String(a?.cohortKey || "")));
  const set = (patch: Partial<typeof messageForm>) => setMessageForm((f) => ({ ...f, ...patch }));

  return (
    <AdminPage
      title="Updates"
      description="Announcements for your students. They see them under Updates on the website and in the app."
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
          title={editingMessageId ? "Edit update" : "New update"}
          description={
            editingMessageId || audience === "cohort"
              ? cohort ? `To everyone in ${cohort.label}` : undefined
              : `To ${targets.length} running cohort${targets.length === 1 ? "" : "s"}: ${targets.map((c) => c.label).join(", ") || "none"}`
          }
        >
          <form onSubmit={editingMessageId ? updateMessage : audience === "cohort" ? sendMessageToCohort : sendToMany} className="space-y-4">
            {!editingMessageId ? (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Send to</p>
                <Segmented
                  label="Send to"
                  value={audience}
                  onChange={(v) => setAudience(v as Audience)}
                  options={[
                    { value: "cohort", label: "The cohort above" },
                    { value: "course", label: "A whole course" },
                    { value: "all", label: "All students" },
                  ]}
                />
                {audience === "course" ? (
                  <select
                    aria-label="Course"
                    value={pathForCourse}
                    onChange={(e) => setCoursePath(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {paths.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : null}
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
            {messageError || fanOutError ? <p className="text-sm font-semibold text-red-600">{fanOutError || messageError}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                loading={editingMessageId ? messageBusyId === editingMessageId : !!busy.sendCohortMessage || fanOutBusy}
                leftIcon={<Send className="h-4 w-4" />}
                disabled={audience === "cohort" || editingMessageId ? !cohort : !targets.length}
              >
                {editingMessageId ? "Save changes" : audience === "cohort" ? "Send update" : `Send to ${targets.length} cohort${targets.length === 1 ? "" : "s"}`}
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

          <Panel title="Sent" description={cohort ? `To ${cohort.label}` : undefined} padded={false}>
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
