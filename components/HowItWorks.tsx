import React from 'react';
import { Step } from '../types';

const steps: Step[] = [
  {
    id: 1,
    title: "Pick Your Professional Path",
    description: "Select between Flutter (Mobile), WordPress (Fast-track Web), or AI-Assisted Dev. Each path is built for industry relevance.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 11V9" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Flexible Weekly Commitment",
    description: "No massive upfront costs. Pay ₦10,000 per week. You control your learning pace and budget—pause or resume at any time.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Join a High-Performance Cohort",
    description: "Get assigned to a focused group of 15 peers. Peer-to-peer accountability ensures you don't drop out like most online learners.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Live Interactive Engineering",
    description: "Attend 3× weekly live sessions. Watch live debugging, participate in Q&A, and follow along as we build production-grade code.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Unlimited Mastery & Archives",
    description: "Missed a class? Access high-definition recordings immediately. Use our internal library of project templates and clean architecture guides.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-32 bg-white dark:bg-slate-900 transition-colors scroll-mt-24 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-teal-600 dark:text-teal-400 uppercase bg-teal-50 dark:bg-teal-900/20 rounded-full border border-teal-100 dark:border-teal-800">
            Roadmap to Confidence
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-blue-900 dark:text-white mb-6 tracking-tight">How we build developers.</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Forget pre-recorded tutorials. We've built a high-intensity, instructor-led process that mirrors how professional engineering teams operate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-[48px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-teal-500/0 via-teal-500/30 to-teal-500/0 -z-0"></div>
          
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center text-center group relative">
              {/* Step Circle */}
              <div className="w-24 h-24 mb-8 relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-teal-500/20 dark:bg-teal-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Main Circle */}
                <div className="relative w-full h-full bg-gray-50 dark:bg-slate-800 text-blue-900 dark:text-teal-400 rounded-full flex items-center justify-center border-2 border-blue-50 dark:border-slate-700 shadow-sm group-hover:border-teal-500 dark:group-hover:border-teal-400 group-hover:bg-blue-900 dark:group-hover:bg-slate-900 group-hover:text-white dark:group-hover:text-teal-400 transition-all duration-500">
                  {step.icon}
                  
                  {/* Step Number Tag */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-lg border-2 border-white dark:border-slate-900 transform rotate-12 group-hover:rotate-0 transition-transform">
                    0{step.id}
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-bold text-blue-900 dark:text-slate-100 mb-4 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-4 lg:px-0">
                {step.description}
              </p>
              
              {/* Desktop arrow/connector visual aid */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[40px] -right-[25px] opacity-20">
                   <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                   </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-24 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
            <div className="flex -space-x-3 px-4 py-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700`}></div>
              ))}
              <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                94%
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 pr-6 pl-2">
              Join 500+ developers who successfully transitioned using this exact process.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;