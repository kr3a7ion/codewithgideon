import React from 'react';
import { IMAGES } from '../assets/images';

const AppPreview: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-900 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm font-semibold mb-6 border border-orange-100 dark:border-orange-800 uppercase tracking-wide">
              App-First Experience
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-blue-900 dark:text-white mb-6 text-center lg:text-left leading-tight">The Classroom in Your Pocket.</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed text-center lg:text-left">
              Our bespoke learning platform is designed for the modern developer. Attend live coding sessions, 
              participate in Q&A, and access your entire curriculum through a high-performance mobile interface.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                "Live class stream with code sync",
                "Instant HD class recordings",
                "Weekly project milestones",
                "Secure enrollment & payments",
                "Direct mentor chat & support",
                "Offline study materials"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-slate-700 dark:text-slate-300 font-medium">
                  <div className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-center lg:justify-start">
              <button className="bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center space-x-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 2h-11c-1.38 0-2.5 1.12-2.5 2.5v19c0 1.38 1.12 2.5 2.5 2.5h11c1.38 0 2.5-1.12 2.5-2.5v-19c0-1.38-1.12-2.5-2.5-2.5zm-5.5 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5.5-5h-11v-14.5h11v14.5z"/></svg>
                <span>Get Started on the App</span>
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 relative flex justify-center scale-90 sm:scale-100">
            {/* Phone Mockup 1: Dashboard */}
            <div className="relative w-64 h-[520px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden transform lg:-rotate-6 z-20">
                <div className="w-full h-full bg-white dark:bg-slate-900 relative flex flex-col p-4">
                   <div className="flex justify-between items-center mb-6 pt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-900 dark:text-teal-400">GA</span>
                      </div>
                      <div className="w-12 h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                   </div>
                   <div className="mb-4">
                      <h4 className="text-xs font-bold text-blue-900 dark:text-slate-200 mb-1">Flutter Mobile Dev</h4>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full">
                         <div className="w-3/4 h-full bg-teal-500 rounded-full"></div>
                      </div>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500">75% Complete</span>
                   </div>
                   <div className="space-y-3 mt-4">
                      <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                         <span className="text-[10px] font-bold text-blue-900 dark:text-teal-400">Next Live Class</span>
                         <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-1">State Management (Provider)</p>
                         <button className="mt-2 w-full bg-blue-900 dark:bg-teal-600 text-white text-[9px] py-1.5 rounded-lg">Join Live Session</button>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                         <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Recent Recording</span>
                         <p className="text-[8px] text-slate-500 dark:text-slate-500 mt-1">Introduction to Dart Objects</p>
                      </div>
                   </div>
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full"></div>
                </div>
            </div>
            {/* Phone Mockup 2: Video Stream */}
            <div className="absolute left-[55%] top-10 w-64 h-[520px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden transform lg:rotate-6 z-10 hidden sm:block">
                 <div className="w-full h-full bg-slate-950 relative flex flex-col">
                   <div className="h-2/5 w-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={IMAGES.hero.instructor} className="w-full h-full object-cover" alt="Video Stream" />
                   </div>
                   <div className="p-4 flex-grow">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-[10px] font-bold text-white">Live Chat</span>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-slate-800 p-2 rounded-lg"><p className="text-[8px] text-slate-300"><span className="text-teal-400 font-bold">Liam:</span> This approach to BuildContext is genius!</p></div>
                        <div className="bg-slate-800 p-2 rounded-lg"><p className="text-[8px] text-slate-300"><span className="text-teal-400 font-bold">Sarah:</span> Can we see the Widget Tree again?</p></div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-700"><p className="text-[8px] text-slate-500">Type a message...</p></div>
                      </div>
                   </div>
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full"></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;