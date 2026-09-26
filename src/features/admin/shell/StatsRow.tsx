/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { motion } from "framer-motion";
import {
  fadeUp,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const StatsRow: React.FC = () => {
  const {
    dashboardCounters,
  } = useAdmin();
  return (
    <>
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8"
      >
        {dashboardCounters.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              whileHover={{ y: -2 }}
              className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <p className={`text-2xl font-black mt-3 ${s.valueClass}`}>
                {s.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
};

export default StatsRow;
