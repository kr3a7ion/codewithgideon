/* Courses & paths: what students can sign up for and what they pay. */
import React from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import CourseModal from "../modals/CourseModal";
import { AdminPage, EmptyHint, OverflowMenu, Panel, Pill, Segmented, Spinner, Toggle, naira } from "../ui";

type Tab = "courses" | "paths";

const CoursesTab: React.FC = () => {
  const {
    courses,
    coursesLoading,
    pathsById,
    openAddCourse,
    openEditCourse,
    deleteCourse,
    toggleCourseLanding,
    toggleCourseExplore,
    parseWeeks,
    parsePricePerWeek,
  } = useAdmin();

  return (
    <Panel
      title="Courses"
      description="Each course belongs to a path and sets the weekly price and number of weeks."
      actions={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAddCourse}>Add course</Button>}
      padded={false}
    >
      {coursesLoading && courses.length === 0 ? (
        <Spinner label="Loading courses" />
      ) : courses.length === 0 ? (
        <EmptyHint icon={<BookOpen className="h-5 w-5" />} title="No courses yet" />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {courses.map((c: any) => {
            const weeks = Number(c.weeks) || parseWeeks(c.duration || "");
            const rate = Number(c.pricePerWeek) || parsePricePerWeek(c.priceLabel || "");
            return (
              <li key={c.id} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    {c.title}
                    {c.isActive === false ? <Pill>Inactive</Pill> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {pathsById.get(String(c.pathId || ""))?.title || "No path"} · {weeks} weeks · {naira(rate)}/week · {naira(weeks * rate)} total
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {Array.isArray(c.syllabus) && c.syllabus.length ? `Syllabus: ${c.syllabus.length} weeks planned` : "No syllabus yet"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div className="w-44"><Toggle checked={c.showOnLanding !== false} onChange={() => toggleCourseLanding(c)} label="On home page" /></div>
                  <div className="w-44"><Toggle checked={c.showInExplore !== false} onChange={() => toggleCourseExplore(c)} label="In course list" /></div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => openEditCourse(c)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={`Edit ${c.title}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <OverflowMenu items={[{ label: "Delete course", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deleteCourse(c) }]} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

const PathsTab: React.FC = () => {
  const {
    paths,
    pathsLoading,
    newPathTitle,
    setNewPathTitle,
    createPath,
    editingPathId,
    editingPathTitle,
    setEditingPathTitle,
    startEditPath,
    cancelEditPath,
    saveEditPath,
    togglePathActive,
    deletePath,
    pathBusyId,
    courses,
  } = useAdmin();

  return (
    <Panel
      title="Paths"
      description="The tracks students choose when they sign up, like “Flutter & Mobile App Development”. Each path has its own course and intakes."
      padded={false}
    >
      <form
        className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          createPath();
        }}
      >
        <label htmlFor="new-path" className="sr-only">New path name</label>
        <input id="new-path" value={newPathTitle} onChange={(e) => setNewPathTitle(e.target.value)} placeholder="New path name" className={inputClass} />
        <Button type="submit" loading={pathBusyId === "create"} leftIcon={<Plus className="h-4 w-4" />}>Add path</Button>
      </form>
      {pathsLoading && paths.length === 0 ? (
        <Spinner label="Loading paths" />
      ) : paths.length === 0 ? (
        <EmptyHint icon={<FolderTree className="h-5 w-5" />} title="No paths yet" />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {paths.map((p) => {
            const courseCount = courses.filter((c: any) => c.pathId === p.id).length;
            return (
              <li key={p.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                {editingPathId === p.id ? (
                  <form
                    className="flex flex-1 flex-col gap-2 sm:flex-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEditPath();
                    }}
                  >
                    <label htmlFor={`path-${p.id}`} className="sr-only">Path name</label>
                    <input id={`path-${p.id}`} value={editingPathTitle} onChange={(e) => setEditingPathTitle(e.target.value)} className={inputClass} autoFocus />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" loading={pathBusyId === p.id}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditPath}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-slate-500">{courseCount} course{courseCount === 1 ? "" : "s"}</p>
                  </div>
                )}
                {editingPathId === p.id ? null : (
                  <div className="flex items-center gap-4">
                    <div className="w-40"><Toggle checked={p.isActive !== false} onChange={() => togglePathActive(p)} label="Open for sign-up" /></div>
                    <OverflowMenu
                      items={[
                        { label: "Rename", icon: <Pencil className="h-4 w-4" />, onSelect: () => startEditPath(p) },
                        { label: "Delete path", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => deletePath(p) },
                      ]}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

const CoursesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "paths" ? "paths" : "courses";
  return (
    <AdminPage title="Courses & paths" description="What students can sign up for, how long it runs and what it costs.">
      <Segmented<Tab>
        label="Courses and paths"
        value={tab}
        onChange={(v) => setParams(v === "paths" ? { tab: "paths" } : {}, { replace: true })}
        options={[
          { value: "courses", label: "Courses" },
          { value: "paths", label: "Paths" },
        ]}
      />
      {tab === "courses" ? <CoursesTab /> : <PathsTab />}
      <CourseModal />
    </AdminPage>
  );
};

export default CoursesPage;
