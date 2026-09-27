/* Classes: the schedule for one cohort, with generate/copy automations. */
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarRange,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { sessionTimeToMs, toLocalDateInput } from "../lib";
import { AdminPage, EmptyHint, OverflowMenu, Panel, Pill, Segmented, Spinner, useNow } from "../ui";
import { ClassFormDialog } from "../parts/ClassFormDialog";
import { CopyScheduleDialog, GenerateScheduleDialog } from "../parts/ScheduleDialogs";
import { RecordingLinkDialog } from "../parts/RecordingLinkDialog";
import type { OverviewSession } from "../useAdminWorkspace";

type View = "upcoming" | "past" | "drafts";

const ClassesPage: React.FC = () => {
  const {
    cohorts,
    cohortsLoading,
    selectedCohortId,
    setSelectedCohortId,
    sessions,
    sessionsLoading,
    sessionsError,
    paths,
    pathsById,
    courses,
    activeByPath,
    openAddSession,
    openEditSession,
    setSessionForm,
    deleteSession,
    patchSession,
    notify,
  } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>("upcoming");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [recordingFor, setRecordingFor] = useState<OverviewSession | null>(null);

  // ?cohort= deep link (from Today / Cohorts) picks the cohort.
  useEffect(() => {
    const wanted = params.get("cohort");
    if (wanted && cohorts.some((c) => c.id === wanted) && wanted !== selectedCohortId) {
      setSelectedCohortId(wanted);
    }
    if (params.get("generate") === "1" && wanted && cohorts.some((c) => c.id === wanted)) {
      setGenerateOpen(true);
      const next = new URLSearchParams(params);
      next.delete("generate");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, cohorts]);

  const cohort = cohorts.find((c) => c.id === selectedCohortId) || null;
  const cohortPathId = String((cohort as any)?.pathId || sessions.find((s) => (s as any).pathId)?.pathId || "");
  const course = courses.find((c) => String((c as any).pathId || "") === cohortPathId);
  const currentIntakeKeys = useMemo(
    () => new Set(Object.values(activeByPath).map((a) => String(a?.cohortKey || ""))),
    [activeByPath],
  );

  const now = useNow();
  const rows = useMemo(() => {
    const withTime = sessions.map((s) => {
      const start = sessionTimeToMs((s as any).startsAt);
      const end = start + Number((s as any).durationMins || 60) * 60_000;
      return { s, start, end };
    });
    const published = withTime.filter((r) => (r.s as any).isPublished !== false);
    return {
      upcoming: published.filter((r) => r.end > now).sort((a, b) => a.start - b.start),
      past: published.filter((r) => r.end <= now).sort((a, b) => b.start - a.start),
      drafts: withTime.filter((r) => (r.s as any).isPublished === false).sort((a, b) => a.start - b.start),
    };
  }, [sessions, now]);

  const selectCohort = (id: string) => {
    setSelectedCohortId(id);
    const next = new URLSearchParams(params);
    next.set("cohort", id);
    setParams(next, { replace: true });
  };

  const addClass = () => {
    openAddSession();
    const nextWeek = Math.max(0, ...sessions.map((s) => Number(s.week || 0))) + 1;
    const p = pathsById.get(cohortPathId);
    const last = rows.upcoming[rows.upcoming.length - 1] || rows.past[0];
    setSessionForm((f) => ({
      ...f,
      pathId: cohortPathId || f.pathId,
      path: p?.title || f.path,
      week: Math.min(52, nextWeek || 1),
      joinUrl: String((last?.s as any)?.joinUrl || ""),
      date: toLocalDateInput(last ? last.start + 7 * 86_400_000 : Date.now()),
    }));
  };

  const togglePublish = async (s: any) => {
    try {
      await patchSession(selectedCohortId, s.id, { isPublished: s.isPublished === false });
      notify("success", s.isPublished === false ? "Class is now visible to students." : "Class hidden (draft).");
    } catch (e: any) {
      notify("error", e?.message || "Couldn't update this class. Open it and save it once, then try again.");
    }
  };

  const list = rows[view];

  return (
    <AdminPage
      title="Classes"
      description="The live class schedule for each cohort. Students see classes for the weeks they've paid for."
      actions={
        cohort ? (
          <>
            <Button variant="secondary" size="sm" leftIcon={<CalendarRange className="h-4 w-4" />} onClick={() => setGenerateOpen(true)}>
              Generate schedule
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={() => setCopyOpen(true)}>
              Copy schedule
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addClass}>
              Add class
            </Button>
          </>
        ) : null
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-96">
          <label htmlFor="classes-cohort" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cohort
          </label>
          <select
            id="classes-cohort"
            value={selectedCohortId}
            onChange={(e) => selectCohort(e.target.value)}
            disabled={cohortsLoading}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {cohorts.length === 0 ? <option value="">No cohorts yet</option> : null}
            {paths.map((p) => {
              const list = cohorts.filter((c) => String((c as any).pathId || "") === p.id);
              if (!list.length) return null;
              return (
                <optgroup key={p.id} label={p.title}>
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}{currentIntakeKeys.has(c.id) ? " · open" : ""}
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
        {cohort ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 sm:pb-2.5">
            {pathsById.get(cohortPathId)?.title || "Unknown path"}
            {currentIntakeKeys.has(cohort.id) ? <Pill tone="teal" className="ml-2">Taking new students</Pill> : null}
          </p>
        ) : null}
      </div>

      {!cohort ? (
        <Panel>
          <EmptyHint icon={<CalendarDays className="h-5 w-5" />} title="No cohort selected">
            Start an intake on the Cohorts page first, then plan its classes here.
          </EmptyHint>
        </Panel>
      ) : (
        <>
          <Segmented<View>
            label="Classes"
            value={view}
            onChange={setView}
            options={[
              { value: "upcoming", label: "Upcoming", count: rows.upcoming.length },
              { value: "past", label: "Past", count: rows.past.length },
              { value: "drafts", label: "Drafts", count: rows.drafts.length },
            ]}
          />

          <Panel padded={false}>
            {sessionsLoading && sessions.length === 0 ? (
              <Spinner label="Loading classes" />
            ) : sessionsError ? (
              <p className="px-5 py-6 text-sm text-red-600">{sessionsError}</p>
            ) : sessions.length === 0 ? (
              <EmptyHint
                icon={<CalendarRange className="h-5 w-5" />}
                title="No classes yet"
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button leftIcon={<CalendarRange className="h-4 w-4" />} onClick={() => setGenerateOpen(true)}>
                      Generate from syllabus
                    </Button>
                    <Button variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={() => setCopyOpen(true)}>
                      Copy from another cohort
                    </Button>
                  </div>
                }
              >
                Create every week's classes in one go, or copy last intake's schedule with new dates.
              </EmptyHint>
            ) : list.length === 0 ? (
              <EmptyHint title={view === "upcoming" ? "No upcoming classes" : view === "past" ? "No past classes" : "No drafts"} />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map(({ s, start, end }) => {
                  const sAny = s as any;
                  const live = start <= now && end > now;
                  const past = end <= now;
                  const d = new Date(start);
                  return (
                    <li key={s.id} className="flex items-start gap-3 px-4 py-3.5 sm:items-center sm:px-5">
                      <div className="w-14 shrink-0 rounded-xl bg-slate-100 py-1.5 text-center dark:bg-slate-800">
                        <p className="text-[11px] font-bold uppercase text-slate-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
                        <p className="font-display text-lg font-bold leading-tight text-blue-900 dark:text-white">{d.getDate()}</p>
                        <p className="text-[11px] text-slate-500">{d.toLocaleDateString(undefined, { month: "short" })}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          <span className="text-slate-500">Week {s.week} · </span>
                          {s.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {Number(sAny.durationMins || 60)} min
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {live ? <Pill tone="danger">Live now</Pill> : null}
                          {sAny.isPublished === false ? <Pill>Draft</Pill> : null}
                          {!past && !sAny.joinUrl ? <Pill tone="orange">No class link</Pill> : null}
                          {past ? (
                            sAny.recordingUrl ? (
                              <Pill tone="success"><Video className="h-3 w-3" aria-hidden /> Recording added</Pill>
                            ) : (
                              <Pill tone="orange">No recording</Pill>
                            )
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {past && !sAny.recordingUrl ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="hidden sm:inline-flex"
                            onClick={() => setRecordingFor({ cohortId: selectedCohortId, cohortLabel: cohort.label, pathId: cohortPathId, session: s })}
                          >
                            Add recording
                          </Button>
                        ) : null}
                        {sAny.isPublished === false ? (
                          <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => togglePublish(sAny)}>
                            Publish
                          </Button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEditSession(s)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`Edit ${s.title}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <OverflowMenu
                          items={[
                            ...(past
                              ? [{
                                  label: sAny.recordingUrl ? "Change recording link" : "Add recording link",
                                  icon: <Video className="h-4 w-4" />,
                                  onSelect: () => setRecordingFor({ cohortId: selectedCohortId, cohortLabel: cohort.label, pathId: cohortPathId, session: s }),
                                }]
                              : []),
                            ...(sAny.joinUrl
                              ? [{
                                  label: "Copy class link",
                                  icon: <Link2 className="h-4 w-4" />,
                                  onSelect: async () => {
                                    try {
                                      await navigator.clipboard.writeText(sAny.joinUrl);
                                      notify("success", "Class link copied.");
                                    } catch {
                                      notify("error", "Couldn't copy. Your browser blocked it.");
                                    }
                                  },
                                }]
                              : []),
                            {
                              label: sAny.isPublished === false ? "Publish" : "Hide (make draft)",
                              icon: sAny.isPublished === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
                              onSelect: () => togglePublish(sAny),
                            },
                            { label: "Delete class", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deleteSession(s) },
                          ]}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </>
      )}

      <ClassFormDialog cohortLabel={cohort ? `${cohort.label}` : undefined} />
      <GenerateScheduleDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        cohort={cohort}
        pathId={cohortPathId}
        course={course}
      />
      <CopyScheduleDialog open={copyOpen} onClose={() => setCopyOpen(false)} cohort={cohort} pathId={cohortPathId} />
      <RecordingLinkDialog item={recordingFor} onClose={() => setRecordingFor(null)} />
    </AdminPage>
  );
};

export default ClassesPage;
