/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Mail, Copy, X } from "lucide-react";
import {
  subtleActionClass,
  formatInboxDate,
  getInboxDisplayName,
  getInboxEmail,
  getInboxPreview,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const SupportInboxModal: React.FC = () => {
  const {
    filter,
    supportLoading,
    supportError,
    selectedSupportId,
    setSelectedSupportId,
    supportFilter,
    setSupportFilter,
    showSupportInboxModal,
    setShowSupportInboxModal,
    fetchSupportMessages,
    markSupportStatus,
    deleteSupportMessage,
    copyToClipboard,
    selectedSupportMessage,
    supportCounts,
    filteredSupportMessages,
  } = useAdmin();
  return (
    <>
      {/* Mail Support Inbox Modal */}
      <AnimatePresence>
        {showSupportInboxModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/75 p-2 backdrop-blur-md sm:p-3 md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.2 }}
              className="mx-auto flex min-h-[96vh] max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)] dark:bg-slate-950 md:h-[92vh] md:min-h-0 md:rounded-[2rem]"
            >
              <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-5 py-5 md:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                      <Mail className="w-3.5 h-3.5" />
                      Mail Support Inbox
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      Website Contact Messages
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Email enquiries from the website stay here, separate
                      from mobile mentor chats.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={fetchSupportMessages}
                      className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => setShowSupportInboxModal(false)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      aria-label="Close Support Inbox"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-5">
                  {[
                    { key: "all", label: "All", count: supportCounts.all },
                    { key: "new", label: "New", count: supportCounts.new },
                    { key: "read", label: "Read", count: supportCounts.read },
                    {
                      key: "resolved",
                      label: "Resolved",
                      count: supportCounts.resolved,
                    },
                  ].map((tab) => {
                    const active = supportFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() =>
                          setSupportFilter(
                            tab.key as
                              | "all"
                              | "new"
                              | "read"
                              | "resolved",
                          )
                        }
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 border ${
                          active
                            ? "bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-lg"
                            : "bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="min-w-[22px] h-[22px] px-1 rounded-full text-[10px] flex items-center justify-center bg-white/15">
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
                <div className="max-h-[34vh] space-y-3 overflow-auto border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 lg:max-h-none lg:border-b-0 lg:border-r">
                  {supportError ? (
                    <div className="p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold">
                      {supportError}
                    </div>
                  ) : supportLoading ? (
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
                      Loading support inbox…
                    </div>
                  ) : filteredSupportMessages.length === 0 ? (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
                      No support messages in this filter.
                    </div>
                  ) : (
                    filteredSupportMessages.map((m) => {
                      const isSelected = selectedSupportId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedSupportId(m.id)}
                          className={`w-full text-left rounded-3xl border p-4 transition-all shadow-sm ${
                            isSelected
                              ? "border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-900 ring-2 ring-blue-500/10"
                              : "border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {getInboxDisplayName(m)}
                          </p>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            {getInboxEmail(m) || "No email"}
                          </p>
                          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {getInboxPreview(m)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-3">
                            {formatInboxDate(m.updatedAt || m.createdAt)}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="min-h-0 overflow-auto bg-white p-5 dark:bg-slate-950 md:p-7">
                  {!selectedSupportMessage ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-5">
                          <Mail className="w-7 h-7" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                          Select a support message
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                          Open an email enquiry from the left to manage it.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300 mb-4">
                            <Mail className="w-3.5 h-3.5" />
                            Email Support
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white break-words">
                            {getInboxDisplayName(selectedSupportMessage)}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 break-all">
                            {getInboxEmail(selectedSupportMessage) ||
                              "No email on file"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold mt-3">
                            {formatInboxDate(selectedSupportMessage.createdAt)}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                getInboxEmail(selectedSupportMessage) || "",
                              )
                            }
                            className={subtleActionClass}
                          >
                            <Copy className="w-4 h-4" />
                            Copy Email
                          </button>
                          <button
                            onClick={() =>
                              markSupportStatus(
                                selectedSupportMessage.id,
                                "read",
                              )
                            }
                            className={subtleActionClass}
                          >
                            Mark Read
                          </button>
                          <button
                            onClick={() =>
                              markSupportStatus(
                                selectedSupportMessage.id,
                                "resolved",
                              )
                            }
                            className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
                          >
                            Resolve
                          </button>
                          <a
                            href={`mailto:${getInboxEmail(selectedSupportMessage)}`}
                            onClick={() =>
                              markSupportStatus(
                                selectedSupportMessage.id,
                                "resolved",
                              )
                            }
                            className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition inline-flex items-center gap-2 ${
                              getInboxEmail(selectedSupportMessage)
                                ? "bg-blue-900 text-white hover:bg-blue-800"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed pointer-events-none"
                            }`}
                          >
                            <Mail className="w-4 h-4" />
                            Email Reply
                          </a>
                          <button
                            onClick={() =>
                              deleteSupportMessage(selectedSupportMessage.id)
                            }
                            className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                          Message
                        </p>
                        <p className="text-[15px] leading-8 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">
                          {getInboxPreview(selectedSupportMessage)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportInboxModal;
