/* One cohort (intake): its dates, students and classes, with rename, dates
   and close. The start date is what students see as their first class day. */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarRange, ChevronRight, Pencil, UserPlus, Users } from "lucide-react";
import { registrationStore, type CohortDoc } from "../../../../services/registrationStore";
import { adminStudents } from "../../../../services/adminStudents";
import { getSiteConfig, saveSiteConfig } from "../../../../services/siteConfig";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { toDateMs } from "../lib";
import { AdminPage, Dialog, EmptyHint, Panel, Pill, Spinner, StatTile, Toggle } from "../ui";
import { StatusPill } from "./StudentsPage";

const fmtDay = (ymd?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  if (!m) return "";
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const ymdOf = (ms: number) => {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const cohortStage = (c: CohortDoc | undefined, isOpen: boolean, now = Date.now()) => {
  if (!c) return { label: "", tone: "slate" as const };
  if (c.status === "finished") return { label: "Finished", tone: "slate" as const };
  if (isOpen) return { label: "Taking new students", tone: "teal" as const };
  const start = c.startsOn ? new Date(`${c.startsOn}T00:00:00`).getTime() : 0;
  if (start && start > now) return { label: "Starts soon", tone: "navy" as const };
  return { label: "Running", tone: "success" as const };
};

const EditCohortDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  cohort: CohortDoc;
  isOpenIntake: boolean;
  firstClassMs: number;
  lastClassMs: number;
}> = ({ open, onClose, cohort, isOpenIntake, firstClassMs, lastClassMs }) => {
  const { fetchCohorts, fetchRegistrations, fetchSiteConfig, startIntake, activeByPath, registrations, notify } = useAdmin();
  const [label, setLabel] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [finished, setFinished] = useState(false);
  const [showOnSite, setShowOnSite] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLabel(cohort.label || "");
    setStartsOn(cohort.startsOn || ymdOf(firstClassMs));
    setEndsOn(cohort.endsOn || ymdOf(lastClassMs));
    setFinished(cohort.status === "finished");
    setShowOnSite(true);
    setError("");
  }, [open, cohort, firstClassMs, lastClassMs]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = label.trim();
    if (name.length < 3) return setError("Give the cohort a name.");
    if (startsOn && endsOn && endsOn < startsOn) return setError("The end date is before the start date.");
    if (finished && isOpenIntake) return setError("This is the intake new students join. Start the next intake first, then finish this one.");
    setSaving(true);
    setError("");
    try {
      await registrationStore.updateCohort(cohort.id, {
        label: name,
        startsOn,
        endsOn,
        status: finished ? "finished" : "running",
      } as any);
      const pathId = String((cohort as any).pathId || "");
      const active: any = pathId ? activeByPath[pathId] : null;
      if (isOpenIntake && active?.seasonKey && name !== cohort.label) await startIntake(pathId, active.seasonKey, name);
      // Students keep a copy of the cohort name on their profile.
      if (name !== cohort.label) {
        const members = registrations.filter((r: any) => r.cohortKey === cohort.id);
        await Promise.all(
          members.map((r: any) =>
            adminStudents.move(r.uid, { cohort: { cohortId: String(r.cohortId || cohort.cohortId || cohort.id), cohortKey: cohort.id, label: name } }),
          ),
        );
      }
      if (isOpenIntake && showOnSite && startsOn) {
        const cfg = await getSiteConfig();
        if (cfg.nextCohortDate !== startsOn) await saveSiteConfig({ ...cfg, nextCohortDate: startsOn });
        await fetchSiteConfig();
      }
      await Promise.all([fetchCohorts(), fetchRegistrations()]);
      notify("success", "Cohort updated.");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save the cohort.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cohort details"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cohort-form" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="cohort-form" onSubmit={save} className="space-y-4">
        <Field label="Name students see" htmlFor="ch-label">
          <input id="ch-label" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} data-autofocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First class" htmlFor="ch-start">
            <input id="ch-start" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Last class" htmlFor="ch-end">
            <input id="ch-end" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          {firstClassMs ? "Filled in from the class schedule. " : ""}Students waiting for this cohort see the first class date.
        </p>
        {isOpenIntake ? (
          <Toggle
            checked={showOnSite}
            onChange={setShowOnSite}
            label="Show on the website"
            description="Updates “Next cohort starts …” on the home page and sign-up pages."
          />
        ) : (
          <Toggle checked={finished} onChange={setFinished} label="Finished" description="Marks the cohort as ended. Students keep their recordings." />
        )}
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

const CohortDetailPage: React.FC = () => {
  const { id = "" } = useParams();
  const { cohorts, cohortsLoading, pathsById, activeByPath, registrations, notify, fetchRegistrations } = useAdmin();
  const cohort = cohorts.find((c) => c.id === id);
  const pathId = String((cohort as any)?.pathId || "");
  const isOpenIntake = !!pathId && activeByPath?.[pathId]?.cohortKey === id;
  const [sessions, setSessions] = useState<any[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState("");

  useEffect(() => {
    let live = true;
    setSessions(null);
    registrationStore
      .getCohortSessions(id)
      .then((list: any[]) => live && setSessions(list))
      .catch(() => live && setSessions([]));
    return () => {
      live = false;
    };
  }, [id]);

  const members = useMemo(
    () => registrations.filter((r: any) => r.cohortKey === id).sort((a, b) => String(a.fullName).localeCompare(String(b.fullName))),
    [registrations, id],
  );
  const unplaced = useMemo(
    () => registrations.filter((r: any) => r.status === "Complete" && !r.cohortKey && (!pathId || r.pathId === pathId)),
    [registrations, pathId],
  );

  const now = Date.now();
  const times = (sessions || []).map((s) => toDateMs(s.startsAt)).filter(Boolean).sort((a, b) => a - b);
  const held = times.filter((t) => t < now).length;
  const next = times.find((t) => t >= now) || 0;
  const missingRecordings = (sessions || []).filter((s) => toDateMs(s.startsAt) < now && !s.recordingUrl).length;

  if (!cohort) {
    return (
      <AdminPage title="Cohort">
        {cohortsLoading ? (
          <Spinner label="Loading cohort" />
        ) : (
          <Panel>
            <EmptyHint title="Cohort not found" action={<Link to="/admin/cohorts" className="font-semibold text-teal-700 hover:underline">Back to cohorts</Link>} />
          </Panel>
        )}
      </AdminPage>
    );
  }

  const stage = cohortStage(cohort, isOpenIntake, now);
  const paid = members.filter((r) => r.status === "Complete").length;

  const place = async (uid: string) => {
    setPlacing(uid);
    try {
      await adminStudents.move(uid, { cohort: { cohortId: String(cohort.cohortId || cohort.id), cohortKey: cohort.id, label: cohort.label } });
      await fetchRegistrations();
      notify("success", `Added to ${cohort.label}.`);
    } catch (err: any) {
      notify("error", err?.message || "Couldn't add them.");
    } finally {
      setPlacing("");
    }
  };

  return (
    <AdminPage
      title={cohort.label}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={stage.tone}>{stage.label}</Pill>
          <span>{pathsById.get(pathId)?.title || (cohort as any).path || ""}</span>
        </span>
      }
      actions={
        <>
          <Button size="sm" variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
            Edit details
          </Button>
          <Link
            to={`/admin/classes?cohort=${encodeURIComponent(id)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-teal-500 dark:text-slate-950"
          >
            <CalendarRange className="h-4 w-4" aria-hidden /> Classes
          </Link>
        </>
      }
    >
      <Link to="/admin/cohorts" className="-mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-900 dark:text-slate-300">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All cohorts
      </Link>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Paid students" value={paid} hint={members.length > paid ? `${members.length - paid} without access` : undefined} />
        <StatTile label="Classes held" value={sessions ? `${held} / ${times.length}` : "…"} hint={missingRecordings ? `${missingRecordings} without a recording` : undefined} tone={missingRecordings ? "orange" : "default"} />
        <StatTile label="Starts" value={<span className="text-lg">{fmtDay(cohort.startsOn) || "Not set"}</span>} hint={cohort.endsOn ? `Ends ${fmtDay(cohort.endsOn)}` : undefined} onClick={() => setEditing(true)} />
        <StatTile label="Next class" value={<span className="text-lg">{next ? fmtDay(ymdOf(next)) : "None"}</span>} />
      </div>

      {!cohort.startsOn ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Set the start date so students waiting for this cohort know when their first class is.
          </p>
          <Button size="sm" onClick={() => setEditing(true)}>Set dates</Button>
        </div>
      ) : null}

      {unplaced.length ? (
        <Panel title="Paid but not in a cohort" description="They can't see any classes until they're placed." padded={false}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {unplaced.map((r) => (
              <li key={r.uid} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Link to={`/admin/students/${encodeURIComponent(r.uid)}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white">
                  {r.fullName}
                </Link>
                <Button size="sm" variant="secondary" leftIcon={<UserPlus className="h-4 w-4" />} loading={placing === r.uid} onClick={() => place(r.uid)}>
                  Add to this cohort
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Students" description={`${members.length} in this cohort`} padded={false}>
        {members.length === 0 ? (
          <EmptyHint icon={<Users className="h-5 w-5" />} title="No students yet">
            {isOpenIntake ? "Students who pay for this course join automatically." : "Move students here from their page."}
          </EmptyHint>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((r: any) => {
              const total = Number(r.courseDurationWeeks || 0);
              const weeks = r.status === "Complete" ? Number(r.weeksToCommit || 0) : 0;
              return (
                <li key={r.uid}>
                  <Link to={`/admin/students/${encodeURIComponent(r.uid)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{r.phone || r.email}</span>
                    </span>
                    <span className="hidden w-28 sm:block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <span className="block h-full rounded-full bg-teal-500" style={{ width: `${total ? Math.min(100, (weeks / total) * 100) : 0}%` }} />
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">{total ? `${weeks} of ${total} weeks` : `${weeks} weeks`}</span>
                    </span>
                    <StatusPill reg={r} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <EditCohortDialog
        open={editing}
        onClose={() => setEditing(false)}
        cohort={cohort}
        isOpenIntake={isOpenIntake}
        firstClassMs={times[0] || 0}
        lastClassMs={times[times.length - 1] || 0}
      />
    </AdminPage>
  );
};

export default CohortDetailPage;
