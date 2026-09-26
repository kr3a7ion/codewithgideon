/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { useAdmin } from "../AdminWorkspaceContext";

const SheetsConfigModal: React.FC = () => {
  const {
    registrations,
    showConfig,
    setShowConfig,
    webhookUrl,
    setWebhookUrl,
    handleSaveWebhook,
  } = useAdmin();
  return (
    <>
      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
            <button
              onClick={() => setShowConfig(false)}
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

            <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">
              Sheet Binding Setup
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Connect your registrations directly to a Google Sheet.
            </p>

            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Google Apps Script URL
                </label>
                <input
                  required
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition"
              >
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SheetsConfigModal;
