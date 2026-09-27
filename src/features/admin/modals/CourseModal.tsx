/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Edit } from "lucide-react";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const CourseModal: React.FC = () => {
  const {
    paths,
    courseModalOpen,
    editingCourse,
    courseForm,
    setCourseForm,
    courseError,
    sessions,
    courseBusyId,
    busy,
    parseWeeks,
    normalizeSyllabus,
    closeCourseModal,
    saveCourse,
  } = useAdmin();
  return (
    <>
      {/* Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
            <button
              onClick={closeCourseModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-blue-900 dark:hover:text-slate-200 transition"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <h3 className="text-xl font-black text-blue-900 dark:text-white mb-2">
              {editingCourse ? "Edit Course" : "Add New Course"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This updates what students see across your site.
            </p>

            <form onSubmit={saveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Image URL (optional)
                </label>
                <input
                  value={courseForm.imageUrl}
                  onChange={(e) =>
                    setCourseForm((p) => ({
                      ...p,
                      imageUrl: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="https://... (jpeg/png/webp)"
                />

                {/* Optional preview (safe) */}
                {courseForm.imageUrl?.trim() ? (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={courseForm.imageUrl.trim()}
                      alt="Course preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (
                          e.currentTarget as HTMLImageElement
                        ).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
              </div>
              {courseError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                  {courseError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Path
                </label>
                <select
                  value={courseForm.pathId}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, pathId: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  required
                >
                  <option value="" disabled>
                    Select a path…
                  </option>
                  {paths.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Title
                </label>
                <input
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="e.g. UI/UX for Developers"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Duration
                  </label>
                  <input
                    onBlur={() => {
                      const w = parseWeeks(courseForm.duration);
                      setCourseForm((p) => ({
                        ...p,
                        weeks: w,
                        duration: `${w} Weeks`,
                        syllabus: normalizeSyllabus(p.syllabus, w),
                      }));
                    }}
                    value={courseForm.duration}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="e.g. 6 Weeks"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-2 font-bold">
                    Weeks (truth): {courseForm.weeks}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Sessions
                  </label>
                  <input
                    value={courseForm.sessions}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        sessions: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="e.g. 2× Weekly"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[120px]"
                  placeholder="Short course overview…"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
                <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={courseForm.isActive}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  Active
                </label>

                <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={courseForm.showOnLanding}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        showOnLanding: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  Show on Landing
                </label>

                <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={courseForm.showInExplore}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        showInExplore: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  Show in Explore
                </label>
              </div>

              <BusyButton
                type="submit"
                busy={courseBusyId === (editingCourse?.id || "create")}
                className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
                busyText={editingCourse ? "Saving..." : "Creating..."}
              >
                {editingCourse ? "Save Changes" : "Create Course"}
              </BusyButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseModal;
