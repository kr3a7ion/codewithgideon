/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, RefreshCw, LogOut, Settings2, Database, Mail, MessageSquare } from "lucide-react";
import {
  formatSessionCountdown,
  fadeUp,
  primaryActionClass,
  successActionClass,
} from "../lib";
import { Spinner } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const AdminHeader: React.FC = () => {
  const {
    onLogout,
    sessionRemainingMs,
    isSyncing,
    setShowConfig,
    paths,
    inboxMessages,
    setShowInboxModal,
    supportMessages,
    setSupportFilter,
    setShowSupportInboxModal,
    cohorts,
    sessions,
    setInboxFilter,
    busy,
    fetchInboxMessages,
    fetchSupportMessages,
    handleRefreshAll,
    handleSyncToSheets,
    unreadInboxCount,
    unreadSupportCount,
  } = useAdmin();
  return (
    <>
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
            <LayoutDashboard size={14} />
            <span>Admin Control Center</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
            Manage paths, cohorts, sessions, payments, mobile chats, and
            support inboxes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
              Auto-lock
            </p>
            <p className="text-sm font-black text-amber-900 dark:text-amber-100 mt-1">
              {formatSessionCountdown(sessionRemainingMs)}
            </p>
          </div>

          <button
            onClick={() => {
              setSupportFilter("all");
              setShowSupportInboxModal(true);
              if (!supportMessages.length) fetchSupportMessages();
            }}
            className="relative p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
            title="Open Support Inbox"
            aria-label="Open Support Inbox"
          >
            <Mail className="w-5 h-5" />
            {unreadSupportCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setInboxFilter("all");
              setShowInboxModal(true);
              if (!inboxMessages.length) fetchInboxMessages();
            }}
            className="relative p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
            title="Open Mobile Chat"
            aria-label="Open Mobile Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadInboxCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">
                {unreadInboxCount > 9 ? "9+" : unreadInboxCount}
              </span>
            )}
          </button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefreshAll}
            disabled={busy.refreshAll}
            className={primaryActionClass}
          >
            {busy.refreshAll ? (
              <Spinner />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {busy.refreshAll ? "Refreshing..." : "Refresh All"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className={`transition-all ${
              isSyncing
                ? "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-200 text-gray-500 inline-flex items-center gap-2"
                : successActionClass
            }`}
          >
            {isSyncing ? <Spinner /> : <Database className="w-4 h-4" />}
            Sync to Sheets
          </motion.button>

          <button
            onClick={() => setShowConfig(true)}
            className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
            title="Configure Sheet Binding"
            aria-label="Configure Sheet Binding"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 hidden md:block" />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default AdminHeader;
