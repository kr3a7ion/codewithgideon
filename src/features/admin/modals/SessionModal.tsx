/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Edit } from "lucide-react";
import { useAdmin } from "../AdminWorkspaceContext";

const SessionModal: React.FC = () => {
  const {
    paths,
    pathsById,
    sessionModalOpen,
    editingSession,
    sessionForm,
    setSessionForm,
    sessionError,
    busy,
    closeSessionModal,
    saveSession,
  } = useAdmin();
  return (
    <>
      {/* Session Modal */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
            <button
              onClick={closeSessionModal}
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
              {editingSession ? "Edit Session" : "Add Session"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Creates a session under this cohort’s schedule.
            </p>

            <form onSubmit={saveSession} className="space-y-4">
              {sessionError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                  {sessionError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sessionForm.week}
                    onChange={(e) =>
                      setSessionForm((p) => ({
                        ...p,
                        week: Math.max(
                          1,
                          parseInt(e.target.value || "1", 10),
                        ),
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Path
                  </label>
                  <select
                    value={sessionForm.pathId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const t = pathsById.get(id)?.title || "";
                      setSessionForm((p) => ({
                        ...p,
                        pathId: id,
                        path: t,
                      }));
                    }}
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

                  <label className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sessionForm.isPublished}
                      onChange={(e) =>
                        setSessionForm((p) => ({
                          ...p,
                          isPublished: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Published (visible to students)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Title
                </label>
                <input
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="e.g. Week 1 Live Class"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) =>
                      setSessionForm((p) => ({
                        ...p,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(e) =>
                      setSessionForm((p) => ({
                        ...p,
                        time: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={sessionForm.durationMins}
                    onChange={(e) =>
                      setSessionForm((p) => ({
                        ...p,
                        durationMins: parseInt(e.target.value || "60", 10),
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Live Session URL (optional)
                </label>
                <input
                  value={sessionForm.joinUrl}
                  onChange={(e) =>
                    setSessionForm((p) => ({
                      ...p,
                      joinUrl: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="Zoom/Meet link..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Recorded Session URL (optional)
                </label>
                <input
                  value={sessionForm.recordingUrl}
                  onChange={(e) =>
                    setSessionForm((p) => ({
                      ...p,
                      recordingUrl: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="Loom/Drive/YouTube recording link..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) =>
                    setSessionForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[110px]"
                  placeholder="Any admin notes..."
                />
              </div>

              <button
                type="submit"
                disabled={busy.createSession || busy.saveSession}
                className="w-full ... disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {busy.createSession || busy.saveSession ? (
                  <>
                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>
                      {editingSession ? "Saving..." : "Creating..."}
                    </span>
                  </>
                ) : editingSession ? (
                  "Save Session"
                ) : (
                  "Create Session"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionModal;
