/* Automations: generate a whole schedule from the syllabus, or copy one. */
import React, { useEffect, useMemo, useState } from "react";
import { CalendarRange, Copy } from "lucide-react";
import type { CohortDoc, CourseDoc } from "../../../../services/registrationStore";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import {
  WEEKDAYS,
  buildSchedule,
  formatDraftWhen,
  nextMonday,
  shiftSchedule,
  type SessionDraft,
} from "../automation";
import { Dialog, Toggle } from "../ui";

const DraftPreview: React.FC<{ drafts: SessionDraft[] }> = ({ drafts }) => {
  if (!drafts.length) {
    return <p className="text-sm text-slate-500">Nothing to create yet. Check the dates and days.</p>;
  }
  const shown = drafts.slice(0, 8);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
      <p className="border-b border-slate-100 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
        Preview · {drafts.length} class{drafts.length === 1 ? "" : "es"}
      </p>
      <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
        {shown.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-3.5 py-2">
            <span className="min-w-0 truncate text-slate-800 dark:text-slate-100">
              <span className="font-semibold">Week {d.week}</span> · {d.title}
            </span>
            <span className="shrink-0 text-xs text-slate-500">{formatDraftWhen(d.startsAtMs)}</span>
          </li>
        ))}
      </ul>
      {drafts.length > shown.length ? (
        <p className="border-t border-slate-100 px-3.5 py-2 text-xs text-slate-500 dark:border-slate-800">
          …and {drafts.length - shown.length} more
        </p>
      ) : null}
    </div>
  );
};

const defaultDays = (course?: CourseDoc) => {
  const s = String(course?.sessions || "").toLowerCase();
  if (s.includes("3")) return [1, 3, 5];
  if (s.includes("1×") || s.includes("1x") || s.includes("once")) return [6];
  return [2, 4];
};

export const GenerateScheduleDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  cohort: CohortDoc | null;
  pathId: string;
  course?: CourseDoc;
}> = ({ open, onClose, cohort, pathId, course }) => {
  const { createSessionsBatch, notify } = useAdmin();
  const [startDate, setStartDate] = useState(nextMonday());
  const [weekdays, setWeekdays] = useState<number[]>(defaultDays(course));
  const [time, setTime] = useState("18:00");
  const [durationMins, setDuration] = useState(90);
  const [weeks, setWeeks] = useState<number>(Number(course?.weeks || 0) || 4);
  const [joinUrl, setJoinUrl] = useState("");
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setWeekdays(defaultDays(course));
    setWeeks(Number(course?.weeks || 0) || 4);
    setError("");
  }, [open, course]);

  const drafts = useMemo(
    () => buildSchedule({ startDate, weekdays, time, durationMins, weeks, joinUrl, publish }, course?.syllabus || []),
    [startDate, weekdays, time, durationMins, weeks, joinUrl, publish, course],
  );

  const toggleDay = (d: number) =>
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const create = async () => {
    if (!cohort) return;
    setSaving(true);
    setError("");
    try {
      const { created, skipped, failed } = await createSessionsBatch(cohort.id, pathId, drafts);
      notify(
        failed ? "error" : "success",
        `Created ${created} class${created === 1 ? "" : "es"} for ${cohort.label}` +
          `${skipped ? `, ${skipped} already existed` : ""}` +
          `${failed ? `, ${failed} couldn't be saved (check them and add them by hand)` : ""}.`,
      );
      onClose();
    } catch (e: any) {
      setError(e?.message || "Couldn't create the schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Generate schedule"
      description={
        course?.syllabus?.length
          ? `Class titles come from the ${course.title} syllabus. You can edit any class afterwards.`
          : "This course has no syllabus yet, so classes are named “Week N class”. You can edit them afterwards."
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={create} loading={saving} disabled={!drafts.length} leftIcon={<CalendarRange className="h-4 w-4" />}>
            Create {drafts.length} class{drafts.length === 1 ? "" : "es"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Week 1 starts" htmlFor="gen-start">
            <input id="gen-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} data-autofocus />
          </Field>
          <Field label="Number of weeks" htmlFor="gen-weeks">
            <input id="gen-weeks" type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Start time" htmlFor="gen-time">
            <input id="gen-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Class days</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const on = weekdays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "h-10 min-w-[3.25rem] rounded-xl px-3 text-sm font-semibold transition",
                    on
                      ? "bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field label="Class link (same for every class)" htmlFor="gen-join" hint="Optional. Add or change it per class later.">
            <input id="gen-join" type="url" inputMode="url" value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://meet.google.com/..." className={inputClass} />
          </Field>
          <Field label="Length (minutes)" htmlFor="gen-dur">
            <input id="gen-dur" type="number" min={15} max={600} step={15} value={durationMins} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
          </Field>
        </div>

        <Toggle checked={publish} onChange={setPublish} label="Visible to students right away" description="Turn off to create them as drafts and publish later." />

        <DraftPreview drafts={drafts} />
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </div>
    </Dialog>
  );
};

export const CopyScheduleDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  cohort: CohortDoc | null;
  pathId: string;
}> = ({ open, onClose, cohort, pathId }) => {
  const { overviewSessions, cohorts, createSessionsBatch, notify } = useAdmin();
  const sources = useMemo(() => {
    const byCohort = new Map<string, number>();
    overviewSessions.forEach((o) => {
      if (o.cohortId !== cohort?.id) byCohort.set(o.cohortId, (byCohort.get(o.cohortId) || 0) + 1);
    });
    return cohorts
      .filter((c) => byCohort.has(c.id))
      .map((c) => ({ cohort: c, count: byCohort.get(c.id) || 0 }));
  }, [overviewSessions, cohorts, cohort?.id]);

  const [sourceId, setSourceId] = useState("");
  const [firstDate, setFirstDate] = useState(nextMonday());
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const samePath = sources.find((s) => String((s.cohort as any).pathId || "") === pathId);
    setSourceId((samePath || sources[0])?.cohort.id || "");
    setError("");
  }, [open, sources, pathId]);

  const drafts = useMemo(() => {
    const src = overviewSessions.filter((o) => o.cohortId === sourceId).map((o) => o.session);
    return shiftSchedule(src, firstDate, publish);
  }, [overviewSessions, sourceId, firstDate, publish]);

  const create = async () => {
    if (!cohort) return;
    setSaving(true);
    setError("");
    try {
      const { created, skipped, failed } = await createSessionsBatch(cohort.id, pathId, drafts);
      notify(
        failed ? "error" : "success",
        `Copied ${created} class${created === 1 ? "" : "es"} to ${cohort.label}` +
          `${skipped ? `, ${skipped} already existed` : ""}` +
          `${failed ? `, ${failed} couldn't be saved` : ""}.`,
      );
      onClose();
    } catch (e: any) {
      setError(e?.message || "Couldn't copy the schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Copy a schedule"
      description="Same weeks, titles, times and class links, moved to new dates. Recordings aren't copied."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={create} loading={saving} disabled={!drafts.length} leftIcon={<Copy className="h-4 w-4" />}>
            Copy {drafts.length} class{drafts.length === 1 ? "" : "es"}
          </Button>
        </>
      }
    >
      {sources.length === 0 ? (
        <p className="text-sm text-slate-500">No other cohort has classes to copy yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Copy from" htmlFor="copy-src">
              <select id="copy-src" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={inputClass}>
                {sources.map((s) => (
                  <option key={s.cohort.id} value={s.cohort.id}>
                    {s.cohort.label} ({s.count} classes)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="First class on" htmlFor="copy-date">
              <input id="copy-date" type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Toggle checked={publish} onChange={setPublish} label="Visible to students right away" />
          <DraftPreview drafts={drafts} />
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        </div>
      )}
    </Dialog>
  );
};
