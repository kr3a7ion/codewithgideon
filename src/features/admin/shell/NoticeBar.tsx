/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  fadeUp,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const NoticeBar: React.FC = () => {
  const {
    adminNotice,
    setAdminNotice,
  } = useAdmin();
  return (
    <>
      {adminNotice ? (
        <motion.div
          variants={fadeUp}
          className={`mb-6 rounded-2xl border px-4 py-4 flex items-start justify-between gap-4 ${
            adminNotice.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
              : adminNotice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200"
          }`}
        >
          <p className="text-sm font-medium">{adminNotice.message}</p>
          <button
            type="button"
            onClick={() => setAdminNotice(null)}
            className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 transition"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </motion.div>
      ) : null}
    </>
  );
};

export default NoticeBar;
