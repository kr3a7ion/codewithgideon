/* Add or edit a course: what it is, what it costs per week, and the week-by-week plan. */
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, Toggle, naira } from "../ui";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"];

type Week = { week: number; title: string; topics: string[] };

/** Keep one entry per week so week 3 stays week 3 even if week 2 is blank. */
const padWeeks = (list: Week[] | undefined, weeks: number): Week[] =>
  Array.from({ length: Math.max(1, weeks) }, (_, i) => {
    const found = (list || []).find((w) => Number(w?.week) === i + 1) || (list || [])[i];
    return { week: i + 1, title: found?.title || "", topics: Array.isArray(found?.topics) ? found!.topics : [] };
  });

const CourseModal: React.FC = () => {
  const { paths, courseModalOpen, editingCourse, courseForm, setCourseForm, courseError, closeCourseModal, saveCourse } =
    useAdmin();
  const [saving, setSaving] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(1);

  const set = (patch: Partial<typeof courseForm>) => setCourseForm((p) => ({ ...p, ...patch }));
  const weeks = Math.min(52, Math.max(1, Math.floor(Number(courseForm.weeks) || 1)));
  const price = Math.max(0, Math.floor(Number(courseForm.pricePerWeek) || 0));
  const plan = padWeeks(courseForm.syllabus as Week[], weeks);
  const planned = plan.filter((w) => w.title.trim() || w.topics.length).length;

  const setWeeks = (n: number) => {
    const w = Math.min(52, Math.max(1, Math.floor(n) || 1));
    setCourseForm((p) => ({ ...p, weeks: w, duration: `${w} Weeks`, syllabus: padWeeks(p.syllabus as Week[], w) }));
  };
  const setWeek = (i: number, patch: Partial<Week>) =>
    setCourseForm((p) => {
      const next = padWeeks(p.syllabus as Week[], weeks);
      next[i] = { ...next[i], ...patch };
      return { ...p, syllabus: next };
    });

  const submit = async (e: React.FormEvent) => {
    setSaving(true);
    try {
      await saveCourse(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={courseModalOpen}
      onClose={closeCourseModal}
      title={editingCourse ? "Edit course" : "Add a course"}
      description="Students see this on the course page and pay the weekly price when they sign up."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={closeCourseModal}>Cancel</Button>
          <Button type="submit" form="course-form" loading={saving}>
            {editingCourse ? "Save changes" : "Create course"}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} className="space-y-6">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Title" htmlFor="course-title">
              <input
                id="course-title"
                value={courseForm.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. Flutter for beginners"
                className={inputClass}
                data-autofocus
                required
                minLength={3}
              />
            </Field>
            <Field label="Path" htmlFor="course-path">
              <select
                id="course-path"
                value={courseForm.pathId}
                onChange={(e) => set({ pathId: e.target.value })}
                className={inputClass}
                required
              >
                <option value="" disabled>Choose a path</option>
                {paths.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description" htmlFor="course-desc" hint="Two or three sentences on what students will build.">
            <textarea
              id="course-desc"
              rows={3}
              value={courseForm.description}
              onChange={(e) => set({ description: e.target.value })}
              className={inputClass}
              required
              minLength={3}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Level" htmlFor="course-level">
              <select id="course-level" value={courseForm.level || "Beginner"} onChange={(e) => set({ level: e.target.value })} className={inputClass}>
                {[...new Set([...LEVELS, courseForm.level || "Beginner"])].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Classes" htmlFor="course-sessions" hint="How often classes run.">
              <input
                id="course-sessions"
                value={courseForm.sessions}
                onChange={(e) => set({ sessions: e.target.value })}
                placeholder="e.g. 2× weekly"
                className={inputClass}
                required
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="text-sm font-bold text-blue-900 dark:text-white">Length and price</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Number of weeks" htmlFor="course-weeks">
              <input
                id="course-weeks"
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Price per week (₦)" htmlFor="course-price" hint="Students pay week by week.">
              <input
                id="course-price"
                type="number"
                inputMode="numeric"
                min={100}
                step={100}
                value={price || ""}
                onChange={(e) => set({ pricePerWeek: Number(e.target.value) })}
                placeholder="e.g. 10000"
                className={inputClass}
                required
              />
            </Field>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {price >= 100 ? (
              <>
                Whole course: <strong className="text-blue-900 dark:text-white">{naira(price * weeks)}</strong> ({weeks} × {naira(price)})
              </>
            ) : (
              "Enter a weekly price to see the total."
            )}
          </p>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-blue-900 dark:text-white">Week-by-week plan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {planned} of {weeks} weeks planned. Shown on the course page and to students.
              </p>
            </div>
          </div>
          <ol className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {plan.map((w, i) => {
              const open = openWeek === w.week;
              const filled = !!(w.title.trim() || w.topics.length);
              return (
                <li key={w.week} className="bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setOpenWeek(open ? null : w.week)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span
                      className={
                        filled
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white"
                          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800"
                      }
                    >
                      {w.week}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {w.title.trim() || <span className="font-normal text-slate-400">Week {w.week}: not planned yet</span>}
                      </span>
                      {w.topics.length ? (
                        <span className="block truncate text-xs text-slate-500">{w.topics.join(" · ")}</span>
                      ) : null}
                    </span>
                    {open ? <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden /> : <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />}
                  </button>
                  {open ? (
                    <div className="space-y-3 px-4 pb-4">
                      <Field label="Week title" htmlFor={`wk-title-${w.week}`}>
                        <input
                          id={`wk-title-${w.week}`}
                          value={w.title}
                          onChange={(e) => setWeek(i, { title: e.target.value })}
                          placeholder="e.g. Layouts and widgets"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Topics" htmlFor={`wk-topics-${w.week}`} hint="One per line.">
                        <textarea
                          id={`wk-topics-${w.week}`}
                          rows={4}
                          value={w.topics.join("\n")}
                          onChange={(e) => setWeek(i, { topics: e.target.value.split("\n") })}
                          placeholder={"Rows and columns\nStack and positioned\nResponsive layouts"}
                          className={inputClass}
                        />
                      </Field>
                      {filled ? (
                        <button
                          type="button"
                          onClick={() => setWeek(i, { title: "", topics: [] })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear week {w.week}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {weeks < 52 ? (
            <button
              type="button"
              onClick={() => {
                setWeeks(weeks + 1);
                setOpenWeek(weeks + 1);
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add a week
            </button>
          ) : null}
        </section>

        <section className="space-y-4">
          <Field label="Cover image link (optional)" htmlFor="course-img">
            <input
              id="course-img"
              type="url"
              value={courseForm.imageUrl}
              onChange={(e) => set({ imageUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
          {courseForm.imageUrl?.trim() ? (
            <img
              src={courseForm.imageUrl.trim()}
              alt=""
              className="h-36 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-800"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          ) : null}
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <Toggle checked={courseForm.isActive} onChange={(v) => set({ isActive: v })} label="Open for sign-ups" description="Turn off to stop new students choosing it." />
            <Toggle checked={courseForm.showOnLanding} onChange={(v) => set({ showOnLanding: v })} label="Show on the home page" />
            <Toggle checked={courseForm.showInExplore} onChange={(v) => set({ showInExplore: v })} label="Show in the course list" />
          </div>
        </section>

        {courseError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {courseError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
};

export default CourseModal;
