/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import type { View } from "../../../app/views";
import { MessageSquare, Send } from "lucide-react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
  formatInboxDate,
  getInboxDisplayName,
  getInboxEmail,
  getInboxPreview,
  isUnreadLearnerChat,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const MobileChatSection: React.FC = () => {
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
    setShowInboxModal,
    activeAdminSection,
    inboxFilter,
    setInboxFilter,
    busy,
    fetchInboxMessages,
    markInboxStatus,
    sendInboxReply,
    selectedInboxMessage,
    inboxCounts,
    filteredInboxMessages,
  } = useAdmin();
  return (
    <>
      {activeAdminSection === "mobileChat" && (
        <div className={`mb-8 p-6 md:p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={sectionTitleClass}>Mobile Mentor Chat</h2>
              <p className={sectionCopyClass}>
                One thread per learner from the mobile app. Class context is
                shown inside each message instead of splitting chats.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={fetchInboxMessages} className={subtleActionClass}>
                Refresh
              </button>
              <button
                onClick={() => setShowInboxModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:bg-blue-800 transition"
              >
                Full Chat View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
            <div className="rounded-[1.75rem] border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-3 max-h-[680px] overflow-auto">
              <div className="flex flex-wrap gap-2 px-1 pb-1">
                {[
                  { key: "all", label: "All", count: inboxCounts.all },
                  { key: "new", label: "New", count: inboxCounts.new },
                  { key: "read", label: "Read", count: inboxCounts.read },
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
                          tab.key as "all" | "new" | "read" | "resolved",
                        )
                      }
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        active
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {tab.label} · {tab.count}
                    </button>
                  );
                })}
              </div>

              {inboxError ? (
                <div className="p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold">
                  {inboxError}
                </div>
              ) : inboxLoading ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
                  Loading mobile chats…
                </div>
              ) : filteredInboxMessages.length === 0 ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
                  No mobile chats in this filter.
                </div>
              ) : (
                filteredInboxMessages.map((m) => {
                  const isSelected = selectedInboxId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedInboxId(m.id);
                        if (isUnreadLearnerChat(m)) {
                          void markInboxStatus(m.id, "read");
                        }
                      }}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-cyan-400 dark:border-cyan-500/50 bg-white dark:bg-slate-950 ring-2 ring-cyan-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/70 hover:border-cyan-200 dark:hover:border-cyan-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                          {(getInboxDisplayName(m) || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {getInboxDisplayName(m)}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {getInboxPreview(m)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-2">
                            {formatInboxDate(m.lastMessageAt || m.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 md:p-6 min-h-[540px]">
              {!selectedInboxMessage ? (
                <div className="h-full min-h-[420px] flex items-center justify-center text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-5">
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Select a mobile chat
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Open a learner thread to reply inside the mobile app.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300 mb-2">
                        Mobile App Thread
                      </p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white break-words">
                        {getInboxDisplayName(selectedInboxMessage)}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 break-all mt-1">
                        {getInboxEmail(selectedInboxMessage) ||
                          "No email on file"}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Last context:{" "}
                        {selectedInboxMessage.sessionTitle ||
                          selectedInboxMessage.pathTitle ||
                          "General mentor support"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          markInboxStatus(selectedInboxMessage.id, "read")
                        }
                        className={subtleActionClass}
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
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 max-h-[360px] overflow-auto space-y-3">
                    {inboxThreadLoading ? (
                      <div className="text-sm text-slate-500 dark:text-slate-300">
                        Loading conversation…
                      </div>
                    ) : inboxThread.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-300">
                        No messages in this thread yet.
                      </div>
                    ) : (
                      inboxThread.map((entry) => {
                        const isAdmin = entry.senderType === "admin";
                        return (
                          <div
                            key={entry.id}
                            className={`flex ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[86%] rounded-[1.35rem] px-4 py-3 border ${
                                isAdmin
                                  ? "bg-blue-900 text-white border-blue-800"
                                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                                {entry.senderName || (isAdmin ? "Admin" : "Learner")} ·{" "}
                                {formatInboxDate(entry.createdAt)}
                              </p>
                              <p className="text-[15px] leading-7 whitespace-pre-wrap break-words">
                                {entry.body}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                    {replyError ? (
                      <div className="mb-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-200">
                        {replyError}
                      </div>
                    ) : null}
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={4}
                      placeholder="Type your reply to the learner..."
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <div className="mt-3 flex justify-end">
                      <BusyButton
                        type="button"
                        onClick={sendInboxReply}
                        busy={replyBusy}
                        busyText="Sending reply..."
                        disabled={!selectedInboxMessage?.id}
                        className="px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-cyan-600 text-white hover:bg-cyan-500 transition inline-flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Mobile Reply
                      </BusyButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileChatSection;
