/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Send, Edit, Trash2 } from "lucide-react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  formatInboxDate,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const MessagesSection: React.FC = () => {
  const {
    activeAdminSection,
    cohorts,
    selectedCohortId,
    setSelectedCohortId,
    cohortMessages,
    messagesLoading,
    messageForm,
    setMessageForm,
    messageError,
    editingMessageId,
    messageBusyId,
    busy,
    fetchCohortMessages,
    sendMessageToCohort,
    startEditMessage,
    cancelEditMessage,
    updateMessage,
    deleteMessage,
  } = useAdmin();
  return (
    <>
      {/* Cohort Messaging */}
      {activeAdminSection === "messages" && (
        <div className={`mb-8 p-8 ${surfaceCardClass}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={sectionTitleClass}>Cohort Messaging</h2>
              <p className={sectionCopyClass}>
                Send announcements directly to students in the selected
                active cohort.
              </p>
            </div>
            <button
              onClick={() => fetchCohortMessages(selectedCohortId)}
              disabled={!selectedCohortId}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                !selectedCohortId
                  ? "bg-gray-200 text-gray-500"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90"
              }`}
            >
              Refresh Messages
            </button>
          </div>

          <form
            onSubmit={
              editingMessageId ? updateMessage : sendMessageToCohort
            }
            className="space-y-4"
          >
            {messageError ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {messageError}
              </div>
            ) : null}

            {editingMessageId && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-800 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                <span>✏️ Editing message</span>
                <button
                  type="button"
                  onClick={cancelEditMessage}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Target Cohort
                </label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  disabled={editingMessageId !== null}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a cohort…
                  </option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-teal-900/20 border border-blue-100 dark:border-teal-800/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-teal-300">
                  Delivery Note
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Messages are written to{" "}
                  <span className="font-black">
                    cohorts/{selectedCohortId || "{cohortId}"}/messages
                  </span>{" "}
                  and can be consumed by the learner app.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={messageForm.title}
                onChange={(e) =>
                  setMessageForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="Message title"
                required
              />
              <input
                value={messageForm.ctaUrl}
                onChange={(e) =>
                  setMessageForm((p) => ({ ...p, ctaUrl: e.target.value }))
                }
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="Optional action link (https://...)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <textarea
                value={messageForm.body}
                onChange={(e) =>
                  setMessageForm((p) => ({ ...p, body: e.target.value }))
                }
                className="md:col-span-2 w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[120px]"
                placeholder="Type announcement message for this cohort..."
                required
              />
              <div className="space-y-3">
                <input
                  value={messageForm.ctaLabel}
                  onChange={(e) =>
                    setMessageForm((p) => ({
                      ...p,
                      ctaLabel: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="Optional CTA label"
                />
                <BusyButton
                  type="submit"
                  busy={
                    editingMessageId
                      ? messageBusyId === editingMessageId
                      : busy.sendCohortMessage
                  }
                  disabled={!selectedCohortId && !editingMessageId}
                  className={`w-full px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:opacity-90 transition ${
                    editingMessageId ? "bg-orange-600" : "bg-blue-900"
                  }`}
                  busyText={editingMessageId ? "Updating..." : "Sending..."}
                >
                  <span className="inline-flex items-center gap-2">
                    {editingMessageId ? (
                      <>
                        <Edit className="w-4 h-4" />
                        Update Message
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </span>
                </BusyButton>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">
              Recent Messages
            </h3>
            {messagesLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading messages…
              </div>
            ) : cohortMessages.length === 0 ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                No sent messages for this cohort yet.
              </div>
            ) : (
              <div className="space-y-3">
                {cohortMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border ${
                      editingMessageId === msg.id
                        ? "border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700"
                        : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {msg.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatInboxDate((msg as any).sentAt)} •{" "}
                          {msg.cohortLabel}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 whitespace-pre-wrap">
                          {msg.body}
                        </p>
                        {msg.ctaLabel && (
                          <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-bold">
                            CTA: {msg.ctaLabel}
                            {msg.ctaUrl && ` → ${msg.ctaUrl}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEditMessage(msg)}
                          disabled={messageBusyId !== null}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-50"
                          title="Edit message"
                          aria-label="Edit message"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          disabled={messageBusyId !== null}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50"
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          {messageBusyId === msg.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
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

export default MessagesSection;
