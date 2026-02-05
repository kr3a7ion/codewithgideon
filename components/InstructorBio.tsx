import React from 'react';
import { IMAGES } from '../assets/images';

const InstructorBio: React.FC = () => {
  return (
    <section className="py-24 bg-blue-900 dark:bg-slate-950 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/3 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-800 dark:border-slate-800 shadow-2xl mx-auto">
                <img src={IMAGES.instructor.portrait} alt="Gideon" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-teal-600 p-4 rounded-2xl shadow-xl transform rotate-6">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-100 mb-1">Lead Instructor</p>
                <p className="font-bold">Gideon Okanlawon</p>
              </div>
            </div>
          </div>
          <div className="lg:w-2/3">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Your Guide to Production Code</h2>
            <p className="text-blue-100 dark:text-slate-300 text-xl leading-relaxed mb-6 font-medium italic">
              "Traditional coding courses fail because they treat programming like a spectator sport. Coding is a craft. You need to be in the room, watching the mistakes, fixing the bugs live, and building together."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 text-left">
              <div className="bg-blue-800/40 dark:bg-slate-800/40 p-6 rounded-2xl border border-blue-700 dark:border-slate-700 hover:bg-blue-800/60 transition-colors">
                <h4 className="font-bold text-teal-400 mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-teal-400 mr-2"></span>
                  Teaching Philosophy
                </h4>
                <p className="text-sm text-blue-100/80 dark:text-slate-400 leading-relaxed">Active recall, peer review, and live feedback. We focus on building real-world projects with clean architecture, not just passing syntax tests.</p>
              </div>
              <div className="bg-blue-800/40 dark:bg-slate-800/40 p-6 rounded-2xl border border-blue-700 dark:border-slate-700 hover:bg-blue-800/60 transition-colors">
                <h4 className="font-bold text-teal-400 mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-teal-400 mr-2"></span>
                  Global Community
                </h4>
                <p className="text-sm text-blue-100/80 dark:text-slate-400 leading-relaxed">Every student is part of a lifelong network. Our alumni work at top tech firms and continue to mentor new students in our community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorBio;