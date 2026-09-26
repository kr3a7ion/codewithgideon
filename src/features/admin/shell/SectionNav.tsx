/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import {
  surfaceCardClass,
} from "../lib";
import { useAdmin } from "../AdminWorkspaceContext";

const SectionNav: React.FC = () => {
  const {
    activeAdminSection,
    selectAdminSection,
    adminSections,
    activeSectionMeta,
  } = useAdmin();
  return (
    <>
      <div className={`mb-8 p-5 ${surfaceCardClass}`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Dashboard Navigation
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose a workspace and focus on one admin task at a time.
            </p>
          </div>
          {activeSectionMeta ? (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-teal-900/20 border border-blue-100 dark:border-teal-800/30">
              <activeSectionMeta.icon className="w-4 h-4 text-blue-700 dark:text-teal-300" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-white">
                {activeSectionMeta.label}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {adminSections.map((section) => (
            <span
              key={`${section.key}-legend`}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${section.badgeClass}`}
            >
              {section.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {adminSections.map((section) => {
            const Icon = section.icon;
            const active = activeAdminSection === section.key;
            return (
              <button
                key={section.key}
                onClick={() => selectAdminSection(section.key)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  active ? section.activeClass : section.inactiveClass
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-white" : "text-current"
                      }`}
                    />
                    <p
                      className={`text-xs font-black uppercase tracking-widest ${
                        active
                          ? "text-white"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {section.label}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center font-black ${
                      active
                        ? "bg-white/15 text-white"
                        : `border ${section.badgeClass}`
                    }`}
                  >
                    {section.badge}
                  </span>
                </div>
                <p
                  className={`text-xs mt-2 ${
                    active
                      ? "text-white/85"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SectionNav;
