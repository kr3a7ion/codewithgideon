/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, MessageSquare, AlertCircle, X, Send } from "lucide-react";
import {
  formatInboxDate,
  getInboxDisplayName,
  getInboxEmail,
  getInboxSourceLabel,
  getInboxPreview,
  isUnreadLearnerChat,
  getInboxThreadCollection,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const MobileChatModal: React.FC = () => {
  const {
    filter,
    inboxLoading,
    inboxError,
    selectedInboxId,
    setSelectedInboxId,
    inboxThread,
    inboxThreadLoading,
    replyDraft,
    setReplyDraft,
    replyError,
    replyBusy,
    showInboxModal,
    setShowInboxModal,
    inboxFilter,
    setInboxFilter,
    busy,
    fetchInboxMessages,
    markInboxStatus,
    deleteInboxMessage,
    sendInboxReply,
    selectedInboxMessage,
    inboxCounts,
    filteredInboxMessages,
  } = useAdmin();
  return (
    <>
      {/* Mobile Chat Modal */}
      <AnimatePresence>
        {showInboxModal && (
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
              className="mx-auto flex min-h-[96vh] max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)] dark:bg-slate-950 md:h-[92vh] md:min-h-0 md:rounded-[2rem]"
            >
              {/* Top bar */}
              <div className="relative border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/70">
                <div className="absolute inset-0 pointer-events-none opacity-60">
                  <div className="absolute -top-10 right-20 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="absolute -bottom-10 left-24 h-28 w-28 rounded-full bg-teal-500/10 blur-2xl" />
                </div>

                <div className="relative flex flex-col gap-4 px-5 py-5 md:px-7 md:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 text-pink-600 dark:text-pink-300 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Mobile Chat
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Mobile Mentor Conversations
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Continue learner mentor chats from the mobile app
                        without mixing them with email support.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={fetchInboxMessages}
                        className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>

                      <button
                        onClick={() => setShowInboxModal(false)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        aria-label="Close Mobile Chat"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: "all", label: "All", count: inboxCounts.all },
                      { key: "new", label: "New", count: inboxCounts.new },
                      {
                        key: "read",
                        label: "Read",
                        count: inboxCounts.read,
                      },
                      {
                        key: "resolved",
                        label: "Resolved",
                        count: inboxCounts.resolved,
                      },
                    ].map((tab) => {
                      const active = inboxFilter === tab.key;

                      return (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setInboxFilter(
                              tab.key as
                                | "all"
                                | "new"
                                | "read"
                                | "resolved",
                            )
                          }
                          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 border ${
                            active
                              ? "bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600 shadow-lg"
                              : "bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`min-w-[22px] h-[22px] px-1 rounded-full text-[10px] flex items-center justify-center ${
                              active
                                ? "bg-white/15 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[380px_1fr]">
                {/* Left rail */}
                <div className="max-h-[34vh] overflow-hidden border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50 xl:max-h-none xl:border-b-0 xl:border-r">
                  <div className="h-full overflow-auto p-4 space-y-3">
                    {inboxError ? (
                      <div className="p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold inline-flex items-start gap-3 w-full">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{inboxError}</span>
                      </div>
                    ) : inboxLoading ? (
                      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 inline-flex items-center gap-3 w-full shadow-sm">
                        <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-teal-400 animate-spin" />
                        Loading mobile chats…
                      </div>
                    ) : filteredInboxMessages.length === 0 ? (
                      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 shadow-sm">
                        No mobile chats in this filter.
                      </div>
                    ) : (
                      filteredInboxMessages.map((m) => {
                        const isSelected = selectedInboxId === m.id;
                        const status = String(
                          m.status || "new",
                        ).toLowerCase();

                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedInboxId(m.id);
                              if (isUnreadLearnerChat(m)) {
                                void markInboxStatus(m.id, "read");
                              }
                            }}
                            className={`w-full text-left rounded-3xl border p-4 transition-all shadow-sm ${
                              isSelected
                                ? "border-blue-200 dark:border-teal-500/30 bg-white dark:bg-slate-900 ring-2 ring-blue-500/10 dark:ring-teal-500/10"
                                : "border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                    {(getInboxDisplayName(m) || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                      {getInboxDisplayName(m)}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                                      {getInboxEmail(m) || "No email"}
                                    </p>
                                  </div>
                                </div>

                                <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {getInboxPreview(m)}
                                </p>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${
                                  status === "new"
                                    ? "bg-pink-50 border border-pink-200 text-pink-600 dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-300"
                                    : status === "resolved"
                                      ? "bg-teal-50 border border-teal-200 text-teal-600 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300"
                                      : "bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400">
                                  {formatInboxDate(
                                    m.updatedAt || m.createdAt,
                                  )}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 mt-1">
                                  {getInboxSourceLabel(m)}
                                </p>
                              </div>

                              {isSelected ? (
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-teal-300">
                                  Open
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right detail */}
                <div className="min-h-0 overflow-hidden bg-white dark:bg-slate-950">
                  <div className="h-full overflow-auto p-5 md:p-7">
                    {!selectedInboxMessage ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="max-w-md text-center">
                          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-5">
                            <MessageSquare className="w-7 h-7" />
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                            Select a mobile chat
                          </h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            Open a learner conversation from the left to reply
                            in-app.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Mobile App Thread
                            </div>

                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white break-words">
                              {getInboxDisplayName(selectedInboxMessage)}
                            </h3>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 break-all">
                              {getInboxEmail(selectedInboxMessage) ||
                                "No email on file"}
                            </p>

                            <p className="text-[11px] text-slate-400 font-bold mt-3">
                              {formatInboxDate(
                                selectedInboxMessage.createdAt,
                              )}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <button
                              onClick={() =>
                                markInboxStatus(
                                  selectedInboxMessage.id,
                                  "read",
                                )
                              }
                              className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              Mark Read
                            </button>

                            <button
                              onClick={() =>
                                markInboxStatus(
                                  selectedInboxMessage.id,
                                  "resolved",
                                )
                              }
                              className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
                            >
                              Resolve
                            </button>

                            <button
                              onClick={() =>
                                deleteInboxMessage(selectedInboxMessage.id)
                              }
                              className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Status
                            </p>
                            <p
                              className={`text-sm font-black mt-2 ${
                                String(
                                  selectedInboxMessage.status || "new",
                                ).toLowerCase() === "new"
                                  ? "text-pink-600 dark:text-pink-300"
                                  : String(
                                        selectedInboxMessage.status || "",
                                      ).toLowerCase() === "resolved"
                                    ? "text-teal-600 dark:text-teal-300"
                                    : "text-blue-900 dark:text-white"
                              }`}
                            >
                              {selectedInboxMessage.status || "new"}
                            </p>
                          </div>

                          <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Channel
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white mt-2">
                              {getInboxSourceLabel(selectedInboxMessage)}
                            </p>
                          </div>

                          <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Student UID
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white mt-2 break-all">
                              {selectedInboxMessage.studentUid ||
                                selectedInboxMessage.auth?.uid ||
                                "Anonymous"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm">
                          <div className="flex items-center justify-between gap-3 mb-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 inline-flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Conversation Thread
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {inboxThread.length} message
                              {inboxThread.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {inboxThreadLoading ? (
                            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-4 py-5 text-sm text-slate-500 dark:text-slate-300 inline-flex items-center gap-3 w-full">
                              <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-teal-400 animate-spin" />
                              Loading conversation…
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {inboxThread.map((entry) => {
                                const isAdmin = entry.senderType === "admin";
                                return (
                                  <div
                                    key={entry.id}
                                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`max-w-[92%] rounded-[1.5rem] border px-4 py-3 shadow-sm sm:max-w-[85%] ${
                                        isAdmin
                                          ? "bg-blue-900 text-white border-blue-800"
                                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                                        <span>
                                          {entry.senderName ||
                                            (isAdmin
                                              ? "Admin Support"
                                              : "Learner")}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {formatInboxDate(entry.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-[15px] leading-7 whitespace-pre-wrap break-words">
                                        {entry.body}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Admin Reply
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Sends a reply into the learner's mobile
                                mentor thread.
                              </p>
                            </div>
                          </div>

                          {replyError ? (
                            <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-200">
                              {replyError}
                            </div>
                          ) : null}

                          <textarea
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            rows={5}
                            placeholder="Type your reply to the learner..."
                            className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-teal-500/20"
                          />

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-400">
                              Replies are stored under{" "}
                              <span className="font-black text-slate-500 dark:text-slate-300">
                                {getInboxThreadCollection(selectedInboxMessage)}/
                                {selectedInboxMessage.id}/messages
                              </span>
                            </p>

                            <BusyButton
                              type="button"
                              onClick={sendInboxReply}
                              busy={replyBusy}
                              busyText="Sending reply..."
                              disabled={!selectedInboxMessage?.id}
                              className="px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:bg-blue-800 transition inline-flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Send Reply
                            </BusyButton>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileChatModal;
