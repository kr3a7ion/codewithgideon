import React from 'react';
import { IMAGES } from '../assets/images';

const WhyGideon: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 relative">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src={IMAGES.whyGideon.collaboration} 
                className="rounded-2xl shadow-lg mt-8 object-cover aspect-[2/3]" 
                alt="Student collaboration" 
              />
              <img 
                src={IMAGES.whyGideon.teaching} 
                className="rounded-2xl shadow-lg object-cover aspect-[2/3]" 
                alt="Instructor teaching" 
              />
            </div>
            {/* Stats Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 text-center z-10">
              <p className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">94%</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Cohort Completion</p>
            </div>
          </div>

          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold text-blue-900 dark:text-white mb-8 leading-tight">Beyond the tutorial.</h2>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-5">
                <div className="mt-1 flex-shrink-0 w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-2">Live Instructor-Led Teaching</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">No more pre-recorded lectures that put you to sleep. Ask questions as they arise and watch real-time coding sessions with industry-standard patterns.</p>
                </div>
              </div>

              <div className="flex items-start space-x-5">
                <div className="mt-1 flex-shrink-0 w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-2">Small Cohort Accountability</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">We limit every class to 15 students. You'll build projects together, perform peer code reviews, and stay motivated through community competition.</p>
                </div>
              </div>

              <div className="flex items-start space-x-5">
                <div className="mt-1 flex-shrink-0 w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-2">Industry-Ready Projects</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Everything we teach is aimed at production. You won't just learn syntax; you'll learn architecture, CI/CD, and how to build scalable software.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyGideon;