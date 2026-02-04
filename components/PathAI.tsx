import React from 'react';
import { View } from '../App';

interface PathProps {
  onNavigate: (view: View) => void;
}

const PathAI: React.FC<PathProps> = ({ onNavigate }) => {
  const modules = [
    { 
      title: 'Module 1: AI for Developers (Foundations)', 
      description: 'The verification mindset. Learn what AI can and can’t do effectively in a coding context.',
      topics: ['Prompting basics', 'Asking good technical questions', 'Verification mindset'] 
    },
    { 
      title: 'Module 2: AI for Coding & Debugging', 
      description: 'Use AI to explain errors, refactor messy code, and understand unfamiliar legacy codebases.',
      topics: ['Explaining errors', 'Refactoring code', 'Logic comparison'] 
    },
    { 
      title: 'Module 3: AI for UI & UX', 
      description: 'Leverage AI for layout suggestions, color palettes, and accessibility checks.',
      topics: ['Layout suggestions', 'Color & design assistance', 'Accessibility checks'] 
    },
    { 
      title: 'Module 4: AI for Project Planning', 
      description: 'Break complex features into small tasks and estimate scope with data-driven AI help.',
      topics: ['Breaking features into tasks', 'Estimating scope', 'Documentation help'] 
    },
    { 
      title: 'Module 5: AI for Content & Deployment', 
      description: 'Generate production-ready app descriptions, website copy, and SEO-optimized titles.',
      topics: ['App descriptions', 'Website copy', 'Release notes'] 
    },
    { 
      title: 'Module 6: Ethics & Responsible Use', 
      description: 'Avoiding dependency and ensuring your learning trajectory stays upward.',
      topics: ['Avoiding dependency', 'Verification mindset', 'Learning vs copying'] 
    },
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
          <div className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Path 3 Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-blue-900 dark:text-white mb-6 leading-tight">AI-Assisted Development & Productivity</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Goal: Teach students how modern developers actually work with AI. Not as a replacement, but as a force multiplier.
          </p>
          <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/20">
             <p className="text-sm text-orange-800 dark:text-orange-300 font-bold">
               ⚠️ Note: This path supports Path 1 & Path 2, but can also stand alone as a productivity deep dive.
             </p>
          </div>
        </header>

        <div className="space-y-8">
          {modules.map((module, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8">
               <div className="md:w-1/3">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-2 leading-tight">{module.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{module.description}</p>
               </div>
               <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {module.topics.map((topic, tidx) => (
                    <div key={tidx} className="bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 border border-transparent hover:border-teal-200 transition-colors">
                       <span className="w-2 h-2 rounded-full bg-orange-400 mr-3"></span>
                       {topic}
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-slate-900 dark:bg-white rounded-[3rem] text-white dark:text-slate-900 text-center shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-3xl font-black mb-4">Become a 10x Developer</h3>
             <p className="opacity-80 mb-8 max-w-xl mx-auto font-medium">Master the tools that are reshaping the industry. Stay ahead of the curve.</p>
             <button 
                onClick={() => { const el = document.getElementById('pricing'); if(el) el.scrollIntoView({behavior:'smooth'}); else onNavigate('home');}}
                className="px-10 py-5 bg-orange-600 dark:bg-orange-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-105"
             >
                Reserve Your Seat — ₦10,000/week
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PathAI;