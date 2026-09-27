/* Add or edit one class. Uses the workspace's session form state. */
import React from "react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, Toggle } from "../ui";

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
  } = useAdmin();

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
            <input id="cls-time" type="time" value={sessionForm.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />
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

        {sessionError ? <p className="text-sm font-semibold text-red-600">{sessionError}</p> : null}
      </form>
    </Dialog>
  );
};
