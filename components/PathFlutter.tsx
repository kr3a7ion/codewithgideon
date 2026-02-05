import React from 'react';
import { View } from '../App';

interface PathProps {
  onNavigate: (view: View, path?: string) => void;
}

const PathFlutter: React.FC<PathProps> = ({ onNavigate }) => {
  const weeks = [
    { title: 'Weeks 1–2: Foundations', topics: ['Flutter overview & setup', 'Dart fundamentals', 'Widgets & UI basics', 'Stateless vs Stateful widgets'], project: 'Mini app: Profile / Info App' },
    { title: 'Weeks 3–4: UI, Input & Navigation', topics: ['Layout system', 'Forms & validation', 'Navigation & data passing', 'Local state with setState'], project: 'Mini multi-screen app' },
    { title: 'Weeks 5–6: Backend & Authentication', topics: ['Firebase setup', 'Authentication (login/register)', 'Firestore basics', 'Real-time data'], project: 'Project: Task / Notes App' },
    { title: 'Weeks 7–8: State Management & Architecture', topics: ['Why state management', 'Structured state flow', 'Refactoring apps', 'Cleaner architecture'], project: 'Project refactor' },
    { title: 'Weeks 9–10: APIs & Local Storage', topics: ['REST APIs', 'HTTP requests', 'Error handling', 'Hive local storage'], project: 'Project: API-powered app' },
    { title: 'Weeks 11–12: Deployment & Final Project', topics: ['Debugging & optimization', 'Android builds (APK/AAB)', 'Play Store requirements', 'Final app build & presentation'], project: 'Assessment & certification' },
  ];

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={() => onNavigate('curriculums')}
          className="text-slate-500 hover:text-blue-900 dark:hover:text-teal-400 mb-8 inline-flex items-center text-sm font-bold uppercase tracking-widest"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Curriculums
        </button>

        <header className="mb-16">
          <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Path 1 Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-blue-900 dark:text-white mb-6 leading-tight">Flutter & Mobile App Development</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Goal: From beginner → confident mobile app developer. 12 weeks of intensive, instructor-led growth.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
               <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Duration</p>
               <p className="font-bold text-blue-900 dark:text-slate-200">12 Weeks</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
               <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Schedule</p>
               <p className="font-bold text-blue-900 dark:text-slate-200">3 Days / Week</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
               <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Classes</p>
               <p className="font-bold text-blue-900 dark:text-slate-200">Live sessions</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
               <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Outcome</p>
               <p className="font-bold text-blue-900 dark:text-slate-200">3–5 Apps</p>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-4">Weekly Breakdown</h2>
          {weeks.map((week, idx) => (
            <div key={idx} className="relative pl-8 md:pl-12 border-l-2 border-blue-100 dark:border-slate-800 last:border-transparent pb-12 last:pb-0">
               <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-blue-900 dark:bg-teal-500 border-4 border-white dark:border-slate-950"></div>
               <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-4">{week.title}</h3>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-6">
                   {week.topics.map((topic, tidx) => (
                     <li key={tidx} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2"></span>
                        {topic}
                     </li>
                   ))}
                 </ul>
                 <div className="pt-4 border-t border-gray-50 dark:border-slate-800">
                   <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Key Milestone</p>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{week.project}</p>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-blue-900 dark:bg-slate-900 rounded-[2rem] text-white text-center shadow-2xl overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4">Start your Flutter journey</h3>
            <p className="text-blue-100/80 mb-8 max-w-xl mx-auto">Pay ₦10,000 per week and learn from a pro. Join the next cohort starting March 15.</p>
            <button 
              onClick={() => onNavigate('registration', 'Flutter & Mobile App Development')}
              className="px-10 py-5 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black text-lg transition-all shadow-lg"
            >
              Enroll Now — ₦10,000/week
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default PathFlutter;