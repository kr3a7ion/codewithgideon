/* Move a student to another cohort and, if needed, another course. Their
   paid weeks stay the same. */
import React, { useEffect, useMemo, useState } from "react";
import type { RegistrationEntry } from "../../../../services/registrationStore";
import { adminStudents } from "../../../../services/adminStudents";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, naira } from "../ui";

export const MoveStudentDialog: React.FC<{ open: boolean; onClose: () => void; reg: RegistrationEntry | null }> = ({
  open,
  onClose,
  reg,
}) => {
  const { courses, cohorts, activeByPath, fetchRegistrations, notify } = useAdmin();
  const r: any = reg || {};
  const currentCourse: any =
    courses.find((c: any) => c.id === r.courseId) || courses.find((c: any) => c.pathId === r.pathId) || null;
  const [courseId, setCourseId] = useState("");
  const [cohortKey, setCohortKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCourseId(String(currentCourse?.id || ""));
    setCohortKey(String(r.cohortKey || ""));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reg?.uid]);

  const course: any = courses.find((c: any) => c.id === courseId) || null;
  const pathId = String(course?.pathId || r.pathId || "");
  const options = useMemo(
    () =>
      [...cohorts]
        .filter((c: any) => !pathId || !c.pathId || c.pathId === pathId)
        .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        .map((c: any) => ({ key: String(c.cohortKey || c.id), id: String(c.cohortId || c.cohortKey || c.id), label: String(c.label || c.id) })),
    [cohorts, pathId],
  );

  // Changing course: default to that course's open intake.
  const pickCourse = (id: string) => {
    setCourseId(id);
    const next: any = courses.find((c: any) => c.id === id);
    const intake = next?.pathId ? activeByPath?.[next.pathId] : null;
    if (next?.pathId !== r.pathId) setCohortKey(String(intake?.cohortKey || ""));
  };

  const changingCourse = !!course && course.id !== currentCourse?.id;
  const chosen = options.find((o) => o.key === cohortKey) || null;
  const paid = r.status === "Complete" ? Number(r.weeksToCommit || 0) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg) return;
    setSaving(true);
    setError("");
    try {
      await adminStudents.move(reg.uid, {
        cohort: chosen ? { cohortId: chosen.id, cohortKey: chosen.key, label: chosen.label } : null,
        course: changingCourse
          ? { id: course.id, pathId: course.pathId, title: course.title, weeks: Number(course.weeks || 0), pricePerWeek: Number(course.pricePerWeek || 0) }
          : null,
      });
      await fetchRegistrations();
      notify("success", chosen ? `${reg.fullName} moved to ${chosen.label}.` : `${reg.fullName} is no longer in a cohort.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't move the student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open && !!reg}
      onClose={onClose}
      title="Move cohort or course"
      description={reg?.fullName}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="move-form" loading={saving}>Move</Button>
        </>
      }
    >
      <form id="move-form" onSubmit={save} className="space-y-4">
        <Field label="Course" htmlFor="move-course">
          <select id="move-course" value={courseId} onChange={(e) => pickCourse(e.target.value)} className={inputClass}>
            {!currentCourse ? <option value="">Choose a course</option> : null}
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.id === currentCourse?.id ? " (current)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cohort" htmlFor="move-cohort" hint="They see this cohort's classes, recordings and group.">
          <select id="move-cohort" value={cohortKey} onChange={(e) => setCohortKey(e.target.value)} className={inputClass}>
            <option value="">Not in a cohort</option>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
                {o.key === r.cohortKey ? " (current)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {paid ? `Their ${paid} paid week${paid === 1 ? "" : "s"} stay as they are.` : "They haven't paid yet."}
          {changingCourse && course?.pricePerWeek
            ? ` Future weeks will cost ${naira(Number(course.pricePerWeek))} each (${Number(course.weeks || 0)} weeks in total).`
            : ""}
          {!chosen && paid ? " Without a cohort they can't see any classes." : ""}
        </div>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};
