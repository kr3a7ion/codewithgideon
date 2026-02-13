import React from 'react';
import { View } from '../src/App';

interface PricingProps {
  onNavigate: (view: View) => void;
}

const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-900 transition-colors scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-sm font-bold mb-6 border border-teal-100 dark:border-teal-800 uppercase tracking-widest">
            Flexible · Affordable · Beginner-Friendly
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-blue-900 dark:text-white mb-6">Simple Weekly Access</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            Attend 3 classes per week, taught live. Pick your path and learn at your own pace—pay as you go.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-blue-900 dark:border-teal-600 shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row">
              {/* Left: Price & CTA */}
              <div className="md:w-2/5 p-10 bg-blue-900 dark:bg-slate-950 text-white flex flex-col justify-center text-center">
                <h3 className="text-xl font-bold mb-4 opacity-80 uppercase tracking-widest">Weekly Access</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black">₦10,000</span>
                  <span className="text-blue-200 dark:text-teal-400 ml-2 font-medium">/ week</span>
                </div>
                <p className="text-sm text-blue-100/70 mb-8 leading-relaxed">
                  Get hands-on training in: <br/>
                  <span className="font-bold text-teal-400">Flutter & Mobile App Dev</span>, <br/>
                  <span className="font-bold text-teal-400">Web Development & WordPress</span>, or <br/>
                  <span className="font-bold text-teal-400">AI-Assisted Development</span>
                </p>
                <button 
                  onClick={() => onNavigate('curriculums')}
                  className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95"
                >
                  Start Learning Now
                </button>
              </div>

              {/* Right: Features */}
              <div className="md:w-3/5 p-10">
                <div className="mb-8">
                  <h4 className="font-bold text-blue-900 dark:text-white mb-4 uppercase text-xs tracking-widest">How It Works</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                      <svg className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      Pay weekly — no long-term commitment
                    </li>
                    <li className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                      <svg className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      Full access to live sessions + materials
                    </li>
                    <li className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                      <svg className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      Take breaks anytime — jump back in when ready
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                  {[
                    "No upfront bulk payments",
                    "Includes support & assignments",
                    "Weekly reminders & updates",
                    "No hidden charges",
                    "Hands-on mini-projects",
                    "Live Q&A sessions"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="text-teal-500 mr-2 text-base">✅</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-8 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/30 text-center flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-orange-900 dark:text-orange-300">Important Requirement</h4>
              <p className="text-orange-800 dark:text-orange-400/80 text-sm">
                💡 Bring your laptop, internet & your will to learn. I’ll guide you from start to confidence.
              </p>
            </div>
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-700 font-bold text-orange-700 dark:text-orange-400 text-xs uppercase tracking-tighter">
              15 Seats per Cohort
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;