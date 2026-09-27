/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Edit } from "lucide-react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const PathsSection: React.FC = () => {
  const {
    paths,
    pathsLoading,
    newPathTitle,
    setNewPathTitle,
    editingPathId,
    editingPathTitle,
    setEditingPathTitle,
    activeAdminSection,
    fetchPaths,
    createPath,
    startEditPath,
    cancelEditPath,
    saveEditPath,
    togglePathActive,
    deletePath,
    courses,
    cohorts,
    sessions,
    pathBusyId,
    busy,
  } = useAdmin();
  return (
    <>
      {/* PATHS MANAGER */}
      {activeAdminSection === "paths" && (
        <div className={`mb-8 p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={sectionTitleClass}>Paths Manager</h2>
              <p className={sectionCopyClass}>
                Create and manage your learning paths (tracks). Everything
                else (courses, cohorts, sessions) ties to these.
              </p>
            </div>

            <button onClick={fetchPaths} className={subtleActionClass}>
              Refresh Paths
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={newPathTitle}
              onChange={(e) => setNewPathTitle(e.target.value)}
              className="flex-1 px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
              placeholder="New Path Title (e.g. Flutter Development)"
            />
            <BusyButton
              busy={pathBusyId === "create"}
              disabled={!newPathTitle.trim()}
              onClick={createPath}
              className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
              busyText="Adding..."
            >
              + Add Path
            </BusyButton>
          </div>

          {pathsLoading ? (
            <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              Loading paths…
            </div>
          ) : paths.length === 0 ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
              No paths yet. Create your first path above (recommended).
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paths.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {editingPathId === p.id ? (
                        <div className="space-y-3">
                          <input
                            value={editingPathTitle}
                            onChange={(e) =>
                              setEditingPathTitle(e.target.value)
                            }
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-blue-900 dark:text-white outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEditPath}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditPath}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold mt-1 break-all">
                            ID: {p.id}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => togglePathActive(p)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                          p.isActive !== false
                            ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                            : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                        }`}
                      >
                        {p.isActive !== false ? "Active" : "Inactive"}
                      </button>

                      {editingPathId !== p.id ? (
                        <button
                          onClick={() => startEditPath(p)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                      ) : null}

                      <BusyButton
                        busy={pathBusyId === p.id}
                        onClick={() => deletePath(p)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                        busyText="Deleting..."
                      >
                        Delete
                      </BusyButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PathsSection;
