/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Edit } from "lucide-react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const CoursesSection: React.FC = () => {
  const {
    paths,
    activeAdminSection,
    pathsById,
    courses,
    coursesLoading,
    parseWeeks,
    parsePricePerWeek,
    formatPriceLabel,
    fetchCourses,
    openAddCourse,
    toggleCourseLanding,
    toggleCourseExplore,
    openEditCourse,
    deleteCourse,
  } = useAdmin();
  return (
    <>
      {/* Course Catalog */}
      {activeAdminSection === "courses" && (
        <div className={`mb-8 p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={sectionTitleClass}>Course Catalog</h2>
              <p className={sectionCopyClass}>
                Add / edit courses shown on the landing page and explore
                pages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={fetchCourses} className={subtleActionClass}>
                Refresh Courses
              </button>

              <button
                onClick={openAddCourse}
                disabled={!paths.length}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !paths.length
                    ? "bg-gray-200 text-gray-500"
                    : "bg-teal-600 text-white hover:bg-teal-500"
                }`}
              >
                + Add Course
              </button>
            </div>
          </div>

          {!paths.length ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200 mb-6">
              Create at least one Path first. Courses must belong to a Path.
            </div>
          ) : coursesLoading ? (
            <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
              No courses found yet. Click <b>Add Course</b> to create the
              first one.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {courses.map((c) => {
                const weeks =
                  (c as any).weeks ?? parseWeeks(c.duration || "4 Weeks");
                const ppw =
                  ((c as any).pricePerWeek ??
                    parsePricePerWeek(c.priceLabel || "₦10k/wk")) ||
                  10000;
                const label = c.priceLabel || formatPriceLabel(ppw);

                const pTitle = (c as any).pathId
                  ? pathsById.get(String((c as any).pathId))?.title
                  : null;

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {c.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {c.description}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold">
                          {weeks} Weeks • {c.sessions} • {c.level} • {label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
                          Path:{" "}
                          <span className="text-slate-600 dark:text-slate-200">
                            {pTitle || "—"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCourseLanding(c)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            (c as any).showOnLanding !== false
                              ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                              : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                          }`}
                          title="Toggle landing page visibility"
                        >
                          {(c as any).showOnLanding !== false
                            ? "Landing: ON"
                            : "Landing: OFF"}
                        </button>

                        <button
                          onClick={() => toggleCourseExplore(c)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            (c as any).showInExplore !== false
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-blue-300"
                              : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                          }`}
                          title="Toggle Explore All Paths visibility"
                        >
                          {(c as any).showInExplore !== false
                            ? "Explore: ON"
                            : "Explore: OFF"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        onClick={() => openEditCourse(c)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(c)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CoursesSection;
