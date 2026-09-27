/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import {
  subtleActionClass,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const ConfirmDialog: React.FC = () => {
  const {
    confirmDialog,
    closeConfirmDialog,
  } = useAdmin();
  return (
    <>
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => closeConfirmDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                  confirmDialog.tone === "danger"
                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                    : confirmDialog.tone === "warning"
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                }`}
              >
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {confirmDialog.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {confirmDialog.message}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeConfirmDialog(false)}
                  className={subtleActionClass}
                >
                  {confirmDialog.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirmDialog(true)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition ${
                    confirmDialog.tone === "danger"
                      ? "bg-red-600 hover:bg-red-500"
                      : confirmDialog.tone === "warning"
                        ? "bg-orange-600 hover:bg-orange-500"
                        : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConfirmDialog;
