/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Database, Search, Trash2 } from "lucide-react";
import {
  surfaceCardClass,
  adminMobileRecordClass,
  adminFieldLabelClass,
  adminFieldValueClass,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const RegistrationsSection: React.FC = () => {
  const {
    registrations,
    loading,
    filter,
    setFilter,
    search,
    setSearch,
    activeAdminSection,
    pathsById,
    handleToggleStatus,
    handleDelete,
    handleClearAll,
    handleExportCSV,
    filteredData,
  } = useAdmin();
  return (
    <>
      {activeAdminSection === "registrations" && (
        <div>
          {/* Registrations Controls */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex shadow-sm">
                {["All", "Pending", "Complete"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      filter === f
                        ? "bg-blue-900 dark:bg-teal-600 text-white shadow-md"
                        : "text-slate-400 hover:text-blue-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone, path, pathId..."
                className="px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest hover:underline"
              >
                Download CSV
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2.5 text-red-600 text-xs font-black uppercase tracking-widest hover:underline"
              >
                Clear Database
              </button>
            </div>
          </div>

          {/* Registrations Table */}
          {loading ? (
            <div className={`p-10 ${surfaceCardClass}`}>
              <p className="text-slate-500 dark:text-slate-400">
                Loading registrations...
              </p>
            </div>
          ) : (
            <div className={`overflow-hidden ${surfaceCardClass}`}>
              <div className="space-y-4 p-4 lg:hidden">
                {filteredData.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                    No registration records found for this filter.
                  </div>
                ) : (
                  filteredData.map((reg) => {
                    const regPathTitle = (reg as any).pathId
                      ? pathsById.get(String((reg as any).pathId))?.title
                      : null;

                    return (
                      <div key={`${reg.uid}-mobile-reg`} className={adminMobileRecordClass}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-sm font-black text-white dark:bg-teal-600">
                            {reg.fullName?.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-black leading-tight text-slate-900 dark:text-white">
                                  {reg.fullName}
                                </p>
                                <p className="mt-1 break-all text-xs font-medium text-slate-500 dark:text-slate-400">
                                  {reg.email}
                                </p>
                              </div>
                              {(reg as any).pendingPayment ? (
                                <span className="rounded-full bg-purple-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
                                  Pending Pay
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 text-[11px] font-bold text-slate-400">
                              {reg.phone} · {reg.gender}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className={adminFieldLabelClass}>Path</p>
                            <p className={adminFieldValueClass}>
                              {regPathTitle || reg.path}
                            </p>
                            {(reg as any).pathId ? (
                              <p className="mt-1 break-all text-[10px] font-bold text-slate-400">
                                ID: {String((reg as any).pathId)}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <p className={adminFieldLabelClass}>Duration</p>
                            <p className={adminFieldValueClass}>
                              {reg.weeksToCommit} Weeks
                            </p>
                          </div>
                          <div>
                            <p className={adminFieldLabelClass}>Total Price</p>
                            <p className="mt-1 text-sm font-black text-teal-600 dark:text-teal-300">
                              ₦{Number(reg.totalPrice || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className={adminFieldLabelClass}>
                              Payment Status
                            </p>
                            <button
                              onClick={() =>
                                handleToggleStatus(reg.uid, reg.status)
                              }
                              className={`mt-2 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                reg.status === "Complete"
                                  ? "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                  : "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                              }`}
                            >
                              {reg.status}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => handleDelete(reg.uid)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Student Info
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Path & Duration
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Price
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Payment Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-8 py-20 text-center text-slate-400 font-medium italic"
                        >
                          No registration records found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((reg) => {
                        const regPathTitle = (reg as any).pathId
                          ? pathsById.get(String((reg as any).pathId))
                              ?.title
                          : null;

                        return (
                          <tr
                            key={reg.uid}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-xs">
                                  {reg.fullName?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-blue-900 dark:text-white leading-tight">
                                    {reg.fullName}
                                  </p>
                                  <p className="text-xs text-slate-400 font-medium mt-1">
                                    {reg.email}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {reg.phone} · {reg.gender}
                                    {(reg as any).pendingPayment ? (
                                      <span className="ml-2 text-purple-600 font-black">
                                        • Pending Pay
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-8 py-6">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                                {regPathTitle || reg.path}
                              </span>

                              {(reg as any).pathId ? (
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  ID: {String((reg as any).pathId)}
                                </span>
                              ) : null}

                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                {reg.weeksToCommit} Weeks
                              </span>
                            </td>

                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-blue-900 dark:text-teal-500">
                                ₦
                                {Number(
                                  reg.totalPrice || 0,
                                ).toLocaleString()}
                              </p>
                            </td>

                            <td className="px-8 py-6">
                              <button
                                onClick={() =>
                                  handleToggleStatus(reg.uid, reg.status)
                                }
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                                  reg.status === "Complete"
                                    ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                                    : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                                }`}
                              >
                                {reg.status}
                              </button>
                            </td>

                            <td className="px-8 py-6">
                              <button
                                onClick={() => handleDelete(reg.uid)}
                                className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                                title="Delete Registration"
                                aria-label="Delete Registration"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default RegistrationsSection;
