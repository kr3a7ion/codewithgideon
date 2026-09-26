/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Edit } from "lucide-react";
import { doc } from "firebase/firestore";
import {
  sessionTimeToMs,
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const CohortSessionsSection: React.FC = () => {
  const {
    activeAdminSection,
    pathsById,
    cohorts,
    cohortsLoading,
    selectedCohortId,
    setSelectedCohortId,
    sessions,
    sessionsLoading,
    sessionBusyId,
    sessionsError,
    busy,
    fetchCohorts,
    activePathId,
    addCohort,
    deleteCohort,
    openAddSession,
    openEditSession,
    deleteSession,
  } = useAdmin();
  return (
    <>
      {/* Cohorts + Sessions Manager */}
      {(activeAdminSection === "cohorts" ||
        activeAdminSection === "sessions" ||
        activeAdminSection === "messages") && (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohorts */}
          <div className={`p-8 ${surfaceCardClass}`}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className={sectionTitleClass}>Cohorts</h2>
                <p className={sectionCopyClass}>
                  Create cohorts and manage session schedules.
                </p>
              </div>

              <button onClick={fetchCohorts} className={subtleActionClass}>
                Refresh
              </button>
            </div>

            <button
              onClick={addCohort}
              disabled={!activePathId}
              className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition mb-6 ${
                !activePathId
                  ? "bg-gray-200 text-gray-500"
                  : "bg-teal-600 text-white hover:bg-teal-500"
              }`}
            >
              + Add Cohort From Active Path + Season
            </button>

            {cohortsLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading cohorts…
              </div>
            ) : cohorts.length === 0 ? (
              <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
                No cohorts yet. Set active cohort first (above), then add
                cohort.
              </div>
            ) : (
              <div className="space-y-3">
                {cohorts.map((c) => {
                  const isSelected = selectedCohortId === c.id;
                  const pathTitle = c.pathId
                    ? pathsById.get(String(c.pathId))?.title
                    : c.path || "";

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCohortId(c.id)} // ✅ doc id
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        isSelected
                          ? "border-blue-900 dark:border-teal-600 bg-blue-50 dark:bg-teal-900/20"
                          : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {c.label}
                          </p>

                          {/* ✅ show doc id (real storage location) */}
                          <p className="text-[11px] text-slate-400 font-bold mt-1 break-all">
                            Doc ID: {c.id}
                          </p>

                          {/* ✅ show cohortKey if present (identity metadata) */}
                          {c.cohortKey ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1 break-all">
                              cohortKey: {c.cohortKey}
                              {c.cohortKey === c.id ? (
                                <span className="ml-2 text-teal-600 font-black">
                                  • matches Doc ID
                                </span>
                              ) : (
                                <span className="ml-2 text-orange-600 font-black">
                                  • differs from Doc ID
                                </span>
                              )}
                            </p>
                          ) : null}

                          {/* ✅ show path identity */}
                          {c.pathId || c.path ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                              Path:{" "}
                              <span className="text-slate-600 dark:text-slate-200">
                                {pathTitle || "—"}
                              </span>
                              {c.pathId ? (
                                <span className="ml-2 text-slate-400 break-all">
                                  (pathId: {c.pathId})
                                </span>
                              ) : null}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCohort(c);
                          }}
                          className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className={`p-8 ${surfaceCardClass}`}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className={sectionTitleClass}>Live Sessions</h2>
                {sessionsError ? (
                  <div className="p-4 mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold">
                    {sessionsError}
                  </div>
                ) : null}
                <p className={sectionCopyClass}>
                  {selectedCohortId
                    ? (() => {
                        const selected = cohorts.find(
                          (x) => x.id === selectedCohortId,
                        );
                        return (
                          <>
                            Cohort Doc ID:{" "}
                            <span className="font-black">
                              {selectedCohortId}
                            </span>
                            {selected?.cohortKey ? (
                              <>
                                {" "}
                                • cohortKey:{" "}
                                <span className="font-black">
                                  {selected.cohortKey}
                                </span>
                              </>
                            ) : null}
                          </>
                        );
                      })()
                    : "Select a cohort to manage sessions."}
                </p>
              </div>

              <BusyButton
                busy={false}
                disabled={!selectedCohortId || sessionsLoading}
                onClick={openAddSession}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !selectedCohortId
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-900 text-white hover:opacity-90"
                }`}
              >
                + Add Session
              </BusyButton>
            </div>

            {sessionsLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                No sessions yet. Add the first session.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          {new Date(
                            sessionTimeToMs((s as any).startsAt),
                          ).toLocaleString()}{" "}
                          • {Number((s as any).durationMins || 60)} mins •
                          Week {(s as any).week || 1}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Path: {(s as any).path || "—"}{" "}
                          {(s as any).isPublished !== false ? (
                            <span className="ml-2 text-teal-600 font-black">
                              • Published
                            </span>
                          ) : (
                            <span className="ml-2 text-orange-600 font-black">
                              • Hidden
                            </span>
                          )}
                        </p>
                        {s.joinUrl ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">
                            Join: {s.joinUrl}
                          </p>
                        ) : null}
                        {(s as any).recordingUrl ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">
                            Recording: {(s as any).recordingUrl}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSession(s)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                        <BusyButton
                          busy={sessionBusyId === s.id}
                          onClick={() => deleteSession(s)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                          busyText="Deleting..."
                        >
                          Delete
                        </BusyButton>
                      </div>
                    </div>

                    {s.notes ? (
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {s.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CohortSessionsSection;
