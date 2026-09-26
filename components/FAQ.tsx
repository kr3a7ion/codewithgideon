import React, { useState } from 'react';
import { FAQItem } from '../types';

const faqData: FAQItem[] = [
  {
    question: "Who is this for?",
    answer: "Code with Gideon is designed for beginner to intermediate developers who thrive in structured environments. If you find self-paced courses lonely or hard to complete, our live cohort-based approach is for you."
  },
  {
    question: "Do I need prior experience?",
    answer: "Our Beginner tracks assume zero prior coding knowledge. For Intermediate tracks, we typically look for basic familiarity with variables, loops, and simple functions in any language."
  },
  {
    question: "Are classes recorded?",
    answer: "Yes! Every single live session is recorded in HD and uploaded to your dashboard immediately after the class ends. You have access to these recordings as long as you remain an active learner."
  },
  {
    question: "How do payments work?",
    answer: "We use a flexible weekly payment model. Choose the number of weeks you want to unlock, then pay the current weekly rate shown during registration. Paystack may add gateway charges at checkout."
  },
  {
    question: "What happens if I miss a class?",
    answer: "Don't worry. You can watch the recording as soon as it's available in the app. If you have questions about the missed material, you can reach out to your mentor or ask in the student community chat."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-slate-950 transition-colors scroll-mt-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400">Everything you need to know about our learning experience.</p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-8 py-6 text-left flex items-center justify-between focus:outline-none group"
              >
                <span className={`font-bold transition-colors ${openIndex === idx ? 'text-teal-600 dark:text-teal-400' : 'text-blue-900 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-white'}`}>
                  {item.question}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-300 ${openIndex === idx ? 'rotate-180 text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-600'}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-8 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-gray-50 dark:border-slate-800 pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
