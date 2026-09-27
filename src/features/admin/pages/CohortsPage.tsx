/* Cohorts: the current intake per path, starting the next one, and history. */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarPlus, CalendarRange, Trash2, UserPlus, UsersRound } from "lucide-react";
import type { PathDoc } from "../../../../services/registrationStore";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { useAdminInsights } from "../insights";
import { currentSeasonKey, nextSeasonKey, seasonLabel } from "../automation";
import { AdminPage, Dialog, EmptyHint, OverflowMenu, Panel, Pill, relativeTime } from "../ui";

const StartIntakeDialog: React.FC<{ path: PathDoc | null; onClose: () => void }> = ({ path, onClose }) => {
  const { activeByPath, startIntake, notify } = useAdmin();
  const navigate = useNavigate();
  const current = path ? activeByPath[path.id] : undefined;
  const [month, setMonth] = useState("");
  const [label, setLabel] = useState("");
  const [labelEdited, setLabelEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!path) return;
    const suggested = current?.seasonKey ? nextSeasonKey(current.seasonKey) : currentSeasonKey();
    setMonth(suggested);
    setLabel(seasonLabel(suggested));
    setLabelEdited(false);
    setError("");
  }, [path, current?.seasonKey]);

  const onMonth = (v: string) => {
    setMonth(v);
    if (!labelEdited) setLabel(seasonLabel(v));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path) return;
    if (!/^\d{4}-\d{2}$/.test(month)) return setError("Pick a month.");
    if (label.trim().length < 3) return setError("Give the intake a name.");
    setSaving(true);
    setError("");
    try {
      const res = await startIntake(path.id, month, label.trim());
      notify("success", `${res.label} is now open for ${path.title}.`);
      onClose();
      navigate(`/admin/classes?cohort=${encodeURIComponent(res.cohortKey)}&generate=1`);
    } catch (err: any) {
      setError(err?.message || "Couldn't start the intake.");
    } finally {
      setSaving(false);
    }
  };

  const same = current?.seasonKey === month;

  return (
    <Dialog
      open={!!path}
      onClose={onClose}
      title={same ? "Rename current intake" : "Start a new intake"}
      description={path?.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="intake-form" loading={saving}>
            {same ? "Save name" : "Start intake"}
          </Button>
        </>
      }
    >
      <form id="intake-form" onSubmit={save} className="space-y-4">
        <Field label="Month it starts" htmlFor="intake-month">
          <input id="intake-month" type="month" value={month} onChange={(e) => onMonth(e.target.value)} className={inputClass} data-autofocus />
        </Field>
        <Field label="Name students will see" htmlFor="intake-label">
          <input
            id="intake-label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setLabelEdited(true);
            }}
            className={inputClass}
          />
        </Field>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {same ? (
            <>This is the intake that's open now, so only its name changes.</>
          ) : (
            <>
              From now on, students who pay for <span className="font-semibold">{path?.title}</span> join{" "}
              <span className="font-semibold">{label || "this intake"}</span>.
              {current?.label ? <> Students already in {current.label} stay there.</> : null}
              {" "}Next, you'll plan its classes.
            </>
          )}
        </div>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

const CohortsPage: React.FC = () => {
  const { cohorts, cohortsLoading, pathsById, overviewSessions, cohortStudentCounts, deleteCohort } = useAdmin();
  const i = useAdminInsights();
  const [startFor, setStartFor] = useState<PathDoc | null>(null);

  const classCounts = useMemo(() => {
    const map: Record<string, number> = {};
    overviewSessions.forEach((o) => (map[o.cohortId] = (map[o.cohortId] || 0) + 1));
    return map;
  }, [overviewSessions]);
  const currentKeys = new Set(i.intakes.map((x) => x.cohortKey).filter(Boolean));

  return (
    <AdminPage
      title="Cohorts"
      description="Each course path has one intake open at a time. Students join the open intake when they pay, and stay in it until they finish."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {i.intakes.map((intake) => {
          const students = cohortStudentCounts[intake.cohortKey] || 0;
          return (
            <Panel key={intake.path.id} title={intake.path.title}>
              {intake.cohortKey ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Open intake</p>
                    <p className="mt-1 font-display text-xl font-bold text-blue-900 dark:text-white">
                      {intake.active?.label || intake.cohortKey}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone="navy">{students} paid student{students === 1 ? "" : "s"}</Pill>
                      {intake.upcomingCount ? (
                        <Pill tone="teal">{intake.upcomingCount} upcoming class{intake.upcomingCount === 1 ? "" : "es"}</Pill>
                      ) : (
                        <Pill tone="orange">No upcoming classes</Pill>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/classes?cohort=${encodeURIComponent(intake.cohortKey)}${intake.upcomingCount ? "" : "&generate=1"}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 text-sm font-bold text-white hover:bg-blue-800 dark:bg-teal-500 dark:text-slate-950"
                    >
                      <CalendarRange className="h-4 w-4" aria-hidden />
                      {intake.upcomingCount ? "View classes" : "Plan classes"}
                    </Link>
                    <Button size="sm" variant="secondary" leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setStartFor(intake.path)}>
                      Start next intake
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No intake is open, so students who pay for this path aren't placed in a cohort yet.
                  </p>
                  <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setStartFor(intake.path)}>
                    Start intake
                  </Button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel title="All cohorts" description="Past and present. Open one to see or change its classes." padded={false}>
        {cohorts.length === 0 && !cohortsLoading ? (
          <EmptyHint icon={<UsersRound className="h-5 w-5" />} title="No cohorts yet" />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cohorts.map((c) => {
              const pathTitle = pathsById.get(String((c as any).pathId || ""))?.title || (c as any).path || "";
              const students = cohortStudentCounts[c.id] || 0;
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {c.label}
                      {currentKeys.has(c.id) ? <Pill tone="teal">Open</Pill> : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {pathTitle} · {students} student{students === 1 ? "" : "s"} · {classCounts[c.id] || 0} classes
                      {c.createdAt ? ` · started ${relativeTime(Number(c.createdAt))}` : ""}
                    </p>
                  </div>
                  <Link
                    to={`/admin/classes?cohort=${encodeURIComponent(c.id)}`}
                    className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                  >
                    Classes
                  </Link>
                  <OverflowMenu
                    items={[
                      {
                        label: "Delete cohort",
                        icon: <Trash2 className="h-4 w-4" />,
                        danger: true,
                        disabled: students > 0,
                        onSelect: () => deleteCohort(c),
                      },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <StartIntakeDialog path={startFor} onClose={() => setStartFor(null)} />
    </AdminPage>
  );
};

export default CohortsPage;
