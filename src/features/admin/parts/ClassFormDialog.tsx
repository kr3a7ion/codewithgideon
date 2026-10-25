/* Add or edit one class. Uses the workspace's session form state. */
import React, { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, Toggle } from "../ui";
import { RecordingCheck } from "./RecordingCheck";
import { ResourceDialog } from "./ResourceDialog";

export const ClassFormDialog: React.FC<{ cohortLabel?: string }> = ({ cohortLabel }) => {
  const {
    sessionModalOpen,
    closeSessionModal,
    editingSession,
    sessionForm,
    setSessionForm,
    saveSession,
    sessionError,
    busy,
    paths,
    resources,
  } = useAdmin();
  const [addingResource, setAddingResource] = useState(false);
  const classResources = editingSession
    ? resources.filter(
        (r: any) =>
          r.sessionId === editingSession.id ||
          (!r.sessionId && r.sessionWeek && Number(r.sessionWeek) === Number(sessionForm.week) && (!r.pathId || r.pathId === sessionForm.pathId)),
      )
    : [];

  const set = (patch: Partial<typeof sessionForm>) => setSessionForm((f) => ({ ...f, ...patch }));
  const saving = !!busy.saveSession || !!busy.createSession;

  return (
    <Dialog
      open={sessionModalOpen}
      onClose={closeSessionModal}
      title={editingSession ? "Edit class" : "Add a class"}
      description={cohortLabel}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={closeSessionModal}>Cancel</Button>
          <Button type="submit" form="class-form" loading={saving}>
            {editingSession ? "Save changes" : "Add class"}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={saveSession} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Field label="Title" htmlFor="cls-title">
            <input
              id="cls-title"
              value={sessionForm.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. State management with Riverpod"
              className={inputClass}
              data-autofocus
            />
          </Field>
          <Field label="Week" htmlFor="cls-week">
            <input
              id="cls-week"
              type="number"
              min={1}
              max={52}
              value={sessionForm.week}
              onChange={(e) => set({ week: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="cls-date">
            <input id="cls-date" type="date" value={sessionForm.date} onChange={(e) => set({ date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Start time" htmlFor="cls-time">
            <input
              id="cls-time"
              type="time"
              value={sessionForm.timeTba ? "" : sessionForm.time}
              disabled={sessionForm.timeTba}
              onChange={(e) => set({ time: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Length (minutes)" htmlFor="cls-dur">
            <input
              id="cls-dur"
              type="number"
              min={15}
              max={600}
              step={15}
              value={sessionForm.durationMins}
              onChange={(e) => set({ durationMins: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>

        <Toggle
          checked={sessionForm.timeTba}
          onChange={(v) => set({ timeTba: v })}
          label="Time not decided yet"
          description="Students see the date with “time to be announced”, and no reminder is sent. Turn off once you set the time."
        />

        <Field label="Class link (Meet, Zoom…)" htmlFor="cls-join" hint="Only students who have paid for this week can see it.">
          <input
            id="cls-join"
            type="url"
            inputMode="url"
            value={sessionForm.joinUrl}
            onChange={(e) => set({ joinUrl: e.target.value })}
            placeholder="https://meet.google.com/..."
            className={inputClass}
          />
        </Field>

        <Field label="Recording link" htmlFor="cls-rec" hint="Add it after the class. Students can rewatch it.">
          <input
            id="cls-rec"
            type="url"
            inputMode="url"
            value={sessionForm.recordingUrl}
            onChange={(e) => set({ recordingUrl: e.target.value })}
            placeholder="https://youtube.com/..."
            className={inputClass}
          />
          <RecordingCheck url={sessionForm.recordingUrl} />
        </Field>

        <Field label="Notes for students" htmlFor="cls-notes" hint="Shown with the class, e.g. what to prepare.">
          <textarea
            id="cls-notes"
            rows={3}
            value={sessionForm.notes}
            onChange={(e) => set({ notes: e.target.value })}
            className={inputClass}
          />
        </Field>

        {paths.length > 1 ? (
          <Field label="Course path" htmlFor="cls-path">
            <select
              id="cls-path"
              value={sessionForm.pathId}
              onChange={(e) => {
                const p = paths.find((x) => x.id === e.target.value);
                set({ pathId: e.target.value, path: p?.title || "" });
              }}
              className={inputClass}
            >
              <option value="">Select a path</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>
        ) : null}

        <Toggle
          checked={sessionForm.isPublished}
          onChange={(v) => set({ isPublished: v })}
          label="Visible to students"
          description="Turn off to keep it as a draft."
        />

        {editingSession ? (
          <section className="rounded-2xl border border-line p-4 dark:border-line-dark">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-blue-900 dark:text-white">Resources for this class</p>
              <Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddingResource(true)}>
                Add
              </Button>
            </div>
            {classResources.length ? (
              <ul className="mt-2 space-y-1.5">
                {classResources.map((r: any) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{r.name}</a>
                    <span className="shrink-0 text-xs text-slate-500">{r.sessionId ? "this class" : `week ${r.sessionWeek}`}</span>
                    {r.isPublished === false ? <span className="shrink-0 text-xs text-orange-600">hidden</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500">None yet. Slides or starter code added here show on the class page.</p>
            )}
          </section>
        ) : null}

        {sessionError ? <p className="text-sm font-semibold text-red-600">{sessionError}</p> : null}
      </form>
      {editingSession ? (
        <ResourceDialog
          open={addingResource}
          onClose={() => setAddingResource(false)}
          preset={{ sessionId: editingSession.id, pathId: sessionForm.pathId, folder: `Week ${sessionForm.week}` }}
        />
      ) : null}
    </Dialog>
  );
};
