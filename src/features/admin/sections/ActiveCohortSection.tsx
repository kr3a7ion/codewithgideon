/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const ActiveCohortSection: React.FC = () => {
  const {
    registrations,
    paths,
    activeAdminSection,
    cohorts,
    selectedCohortId,
    sessions,
    activePathId,
    setActivePathId,
    activeSeasonKey,
    setActiveSeasonKey,
    activeSeasonLabel,
    setActiveSeasonLabel,
    computedCohortId,
    computedCohortKey,
    cohortSaving,
    saveActiveCohort,
  } = useAdmin();
  return (
    <>
      {/* Active Cohort (PER PATH) */}
      {(activeAdminSection === "paths" ||
        activeAdminSection === "cohorts" ||
        activeAdminSection === "sessions" ||
        activeAdminSection === "messages") && (
        <div className={`mb-8 p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={sectionTitleClass}>
                Active Cohort (Per Path)
              </h2>
              <p className={sectionCopyClass}>
                New student registrations use the active cohort mapped to
                their selected path.
              </p>
            </div>

            <button
              onClick={saveActiveCohort}
              disabled={
                cohortSaving ||
                !activePathId ||
                !activeSeasonKey.trim() ||
                !activeSeasonLabel.trim()
              }
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                cohortSaving
                  ? "bg-gray-200 text-gray-500"
                  : "bg-blue-900 text-white hover:opacity-90"
              }`}
            >
              {cohortSaving ? "Saving..." : "Save Active Cohort"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Path
              </label>

              <select
                value={activePathId}
                onChange={(e) => setActivePathId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
              >
                {paths.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              {!paths.length ? (
                <p className="text-[11px] text-orange-600 mt-2 font-bold">
                  Create paths first (above), then set active cohort.
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Season Key
              </label>
              <input
                value={activeSeasonKey}
                onChange={(e) => setActiveSeasonKey(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. 2026-03"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-bold">
                Used to build cohortKey:{" "}
                <span className="text-slate-500">
                  {computedCohortKey || "—"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Season Label
              </label>
              <input
                value={activeSeasonLabel}
                onChange={(e) => setActiveSeasonLabel(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. March 2026 Cohort"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-bold">
                cohortId:{" "}
                <span className="text-slate-500">
                  {computedCohortId || "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ✅ This sets the active cohort identity for this path:
              <span className="font-black">
                {" "}
                {computedCohortKey || "—"}
              </span>
              .
              <br />
              Sessions are stored under a cohort document (Doc ID) in{" "}
              <span className="font-black">/cohorts</span> →{" "}
              <span className="font-black">
                {selectedCohortId || "Select a cohort above"}
              </span>{" "}
              and its <span className="font-black">/sessions</span>{" "}
              subcollection.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ActiveCohortSection;
