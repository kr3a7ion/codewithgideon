/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { useAdmin } from "../AdminWorkspaceContext";

const AdminFooter: React.FC = () => {
  const {
    webhookUrl,
    sessions,
  } = useAdmin();
  return (
    <>
      {/* Footer status (unchanged) */}
      <div className="mt-16 p-8 bg-blue-900 dark:bg-slate-900 rounded-[2rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-black mb-4">
            Infrastructure Status
          </h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <div className="w-3 h-3 bg-teal-400 rounded-full" />
              <span className="text-sm font-medium">
                Firebase Auth: <span className="text-teal-400">ONLINE</span>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  webhookUrl ? "bg-teal-400" : "bg-orange-400"
                }`}
              />
              <span className="text-sm font-medium">
                Sheets Binding:{" "}
                {webhookUrl ? (
                  <span className="text-teal-400">CONNECTED</span>
                ) : (
                  <span className="text-orange-200">NOT CONFIGURED</span>
                )}
              </span>
            </li>
          </ul>
        </div>

        <div className="md:w-1/2 p-6 bg-white/5 dark:bg-white/10 rounded-2xl border border-white/10">
          <p className="text-xs text-blue-100/70 mb-2 uppercase tracking-widest font-bold">
            Admin Notice
          </p>
          <p className="text-xs leading-relaxed opacity-80">
            Keep approvals consistent: approve pending payments only after
            verifying Paystack reference. Cohorts/sessions are admin-managed
            and visible to students based on your app UI.
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminFooter;
