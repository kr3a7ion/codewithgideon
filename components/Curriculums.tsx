import React from 'react';
import { View } from '../App';
import { IMAGES } from '../assets/images';

interface CurriculumsProps {
  onNavigate: (view: View, path?: string) => void;
}

const Curriculums: React.FC<CurriculumsProps> = ({ onNavigate }) => {
  const paths = [
    {
      id: 'path-flutter' as View,
      title: 'Flutter & Mobile App Development',
      duration: '12 Weeks',
      focus: 'Beginner → Mobile Dev',
      image: IMAGES.placeholders.courseFlutter,
      description: 'The complete journey from Dart basics to publishing real-world iOS and Android applications with professional state management.',
      accent: 'border-teal-500'
    },
    {
      id: 'path-web' as View,
      title: 'Web Development & WordPress',
      duration: '6 Weeks',
      focus: 'Monetize Fast',
      image: IMAGES.placeholders.courseWeb,
      description: 'A practical track designed to help you build and sell client-ready websites. Master themes, plugins, and professional deployment.',
      accent: 'border-blue-500'
    },
    {
      id: 'path-ai' as View,
      title: 'AI-Assisted Development',
      duration: '4-6 Weeks',
      focus: 'Productivity & Flow',
      image: IMAGES.placeholders.courseAI,
      description: 'Learn to use AI tools like a senior developer. Optimize your workflow, debug faster, and build better products with AI as your co-pilot.',
      accent: 'border-orange-500'
    }
  ];

  return (
    <div className="py-24 bg-white dark:bg-slate-900 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <button 
            onClick={() => onNavigate('home')}
            className="text-slate-500 hover:text-blue-900 dark:hover:text-teal-400 mb-8 inline-flex items-center text-sm font-bold uppercase tracking-widest"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
          <h1 className="text-4xl md:text-6xl font-black text-blue-900 dark:text-white mb-6">Choose Your Path.</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Each curriculum is designed to be practical, structured, and instructor-led. Select a path to see the full weekly syllabus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {paths.map((path) => (
            <div 
              key={path.id} 
              className={`bg-gray-50 dark:bg-slate-800 rounded-3xl overflow-hidden border-2 ${path.accent} shadow-xl flex flex-col hover:translate-y-[-8px] transition-all duration-300 group`}
            >
              <div className="h-48 overflow-hidden relative">
                <img src={path.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={path.title} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white text-xs font-bold uppercase tracking-widest">{path.focus}</span>
                </div>
              </div>
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-white leading-tight">{path.title}</h2>
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-black px-2 py-1 rounded-full uppercase flex-shrink-0 ml-2">
                    {path.duration}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  {path.description}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => onNavigate(path.id)}
                    className="w-full py-4 bg-blue-900 dark:bg-slate-700 text-white dark:text-slate-100 font-bold rounded-xl shadow-md hover:bg-blue-800 dark:hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
                  >
                    View Syllabus
                  </button>
                  <button 
                    onClick={() => onNavigate('registration', path.title)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-teal-50 dark:bg-slate-800/50 p-12 rounded-[2rem] border border-teal-100 dark:border-slate-700 text-center">
          <h3 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">Ready to start?</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Choose a path above to see the full curriculum, or click Enroll Now to secure your seat in the next cohort.
          </p>
          <button 
             onClick={() => { const el = document.getElementById('pricing'); if(el) el.scrollIntoView({behavior:'smooth'}); else onNavigate('home');}}
             className="bg-teal-600 hover:bg-teal-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all"
          >
            View Pricing Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default Curriculums;