/* Change many upcoming classes at once: the class link, or the dates. */
import React, { useEffect, useMemo, useState } from "react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { sessionTimeToMs } from "../lib";
import { Dialog } from "../ui";

const DAY = 86_400_000;

const useUpcoming = (sessions: any[]) =>
  useMemo(() => {
    const now = Date.now();
    return sessions
      .map((s) => ({ s, start: sessionTimeToMs(s.startsAt) }))
      .filter((r) => r.start + Number(r.s.durationMins || 60) * 60_000 > now)
      .sort((a, b) => a.start - b.start);
  }, [sessions]);

export const BulkLinkDialog: React.FC<{ open: boolean; onClose: () => void; cohortId: string }> = ({ open, onClose, cohortId }) => {
  const { sessions, patchSession, notify } = useAdmin();
  const upcoming = useUpcoming(sessions as any[]);
  const [url, setUrl] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUrl(String(upcoming.find((r) => r.s.joinUrl)?.s.joinUrl || ""));
    setOnlyMissing(false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const targets = upcoming.filter((r) => !onlyMissing || !r.s.joinUrl);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) return setError("Paste the full link, starting with https://");
    setSaving(true);
    setError("");
    try {
      for (const r of targets) await patchSession(cohortId, r.s.id, { joinUrl: clean });
      notify("success", `Class link set on ${targets.length} class${targets.length === 1 ? "" : "es"}.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Some classes couldn't be updated. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Set the class link"
      description="Use one Meet or Zoom link for the upcoming classes in this cohort."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="bulk-link" loading={saving} disabled={!targets.length}>
            Update {targets.length} class{targets.length === 1 ? "" : "es"}
          </Button>
        </>
      }
    >
      <form id="bulk-link" onSubmit={save} className="space-y-4">
        <Field label="Class link" htmlFor="bulk-url">
          <input id="bulk-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/…" className={inputClass} data-autofocus />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="h-4 w-4" />
          Only classes that don&rsquo;t have a link yet
        </label>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

export const ShiftScheduleDialog: React.FC<{ open: boolean; onClose: () => void; cohortId: string }> = ({ open, onClose, cohortId }) => {
  const { sessions, patchSession, notify } = useAdmin();
  const upcoming = useUpcoming(sessions as any[]);
  const [days, setDays] = useState(7);
  const [fromId, setFromId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDays(7);
    setFromId(upcoming[0]?.s.id || "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fromIndex = Math.max(0, upcoming.findIndex((r) => r.s.id === fromId));
  const targets = upcoming.slice(fromIndex);
  const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(days));
    if (!n || Math.abs(n) > 120) return setError("Enter a number of days between -120 and 120.");
    setSaving(true);
    setError("");
    try {
      for (const r of targets) {
        const start = r.start + n * DAY;
        await patchSession(cohortId, r.s.id, { startsAt: start, endsAt: start + Number(r.s.durationMins || 60) * 60_000 });
      }
      notify("success", `Moved ${targets.length} class${targets.length === 1 ? "" : "es"} ${n > 0 ? "later" : "earlier"} by ${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Some classes couldn't be moved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Move classes"
      description="Push the schedule back (or bring it forward), e.g. for a public holiday or a break week."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="shift-form" loading={saving} disabled={!targets.length}>
            Move {targets.length} class{targets.length === 1 ? "" : "es"}
          </Button>
        </>
      }
    >
      <form id="shift-form" onSubmit={save} className="space-y-4">
        <Field label="Starting from" htmlFor="shift-from">
          <select id="shift-from" value={fromId} onChange={(e) => setFromId(e.target.value)} className={inputClass}>
            {upcoming.map((r) => (
              <option key={r.s.id} value={r.s.id}>
                {fmt(r.start)}: Week {r.s.week}, {r.s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Move by (days)" htmlFor="shift-days" hint="7 = one week later. Use a negative number to bring classes forward.">
          <input id="shift-days" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputClass} />
        </Field>
        {targets.length ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {fmt(targets[0].start)} becomes <strong>{fmt(targets[0].start + Math.round(days || 0) * DAY)}</strong>, and every class after it moves the same amount. Times stay the same.
          </p>
        ) : (
          <p className="text-sm text-slate-500">No upcoming classes to move.</p>
        )}
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};
