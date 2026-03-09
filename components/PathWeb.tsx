import React from 'react';
import { View } from '../src/App';

interface PathProps {
  onNavigate: (view: View, path?: string) => void;
}

const PathWeb: React.FC<PathProps> = ({ onNavigate }) => {
  const weeks = [
    { title: 'Week 1: WordPress Foundations', topics: ['What is WordPress', 'WordPress.com vs WordPress.org', 'Domain & hosting basics', 'Local & online installation', 'Dashboard overview'] },
    { title: 'Week 2: Themes & Site Structure', topics: ['Choosing & installing themes', 'Customizing site identity', 'Pages, menus & navigation', 'Permalinks & settings'] },
    { title: 'Week 3: Content Creation & Blogging', topics: ['Posts vs Pages', 'Blogging basics', 'Media handling', 'Categories, tags & metadata'] },
    { title: 'Week 4: Plugins & Functionality', topics: ['Essential plugins', 'Contact forms', 'SEO basics', 'Security & backups'] },
    { title: 'Week 5: Business Websites', topics: ['Landing pages', 'Service websites', 'Portfolio & company sites', 'Client-ready structure'] },
    { title: 'Week 6: Deployment & Monetization', topics: ['Going live', 'Maintenance basics', 'Pricing client jobs', 'Final website project'] },
  ];

  return (
    <div className="py-24 bg-white dark:bg-slate-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => onNavigate("curriculums")}
          className="text-slate-500 hover:text-blue-900 dark:hover:text-teal-400 mb-8 inline-flex items-center text-sm font-bold uppercase tracking-widest"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Curriculums
        </button>

        <header className="mb-16">
          <div className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Path 2 Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-blue-900 dark:text-white mb-6 leading-tight">
            Web Development & WordPress
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Goal: Build real websites and start earning fast. Practical track
            focusing on real-world projects.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Duration
              </p>
              <p className="font-bold text-blue-900 dark:text-slate-200">
                6 Weeks
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Schedule
              </p>
              <p className="font-bold text-blue-900 dark:text-slate-200">
                3 Days / Week
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Outcome
              </p>
              <p className="font-bold text-blue-900 dark:text-slate-200">
                2–3 Websites
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Focus
              </p>
              <p className="font-bold text-blue-900 dark:text-slate-200">
                Fast Earning
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {weeks.map((week, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all"
            >
              <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center mr-3 text-sm font-black">
                  {idx + 1}
                </span>
                {week.title}
              </h3>
              <ul className="space-y-3">
                {week.topics.map((topic, tidx) => (
                  <li
                    key={tidx}
                    className="flex items-start text-sm text-slate-600 dark:text-slate-400"
                  >
                    <svg
                      className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-teal-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl">
          <div className="md:w-2/3">
            <h3 className="text-3xl font-bold mb-4">
              Launch your freelance career
            </h3>
            <p className="text-teal-50 mb-6">
              Our WordPress track is built for speed. Start building paid sites
              in weeks, not years.
            </p>
            <button
              onClick={() =>
                onNavigate("create-account", "Web Development & WordPress")
              }
              className="px-10 py-5 bg-white text-teal-600 rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-105"
            >
              Start This Path — ₦10,000/week
            </button>
          </div>
          <div className="md:w-1/3 text-6xl opacity-20 font-black hidden md:block">
            WP.02
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathWeb;