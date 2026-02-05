
import React from 'react';
import { Course } from '../types';
import { IMAGES } from '../assets/images';
import { View } from '../App';

interface CoursesProps {
  onNavigate: (view: View, path?: string) => void;
}

const sampleCourses: Course[] = [
  {
    title: "Flutter & Mobile App Development",
    duration: "12 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description: "Our flagship program. Go from zero to publishing production-grade mobile apps on iOS and Android. Master Clean Architecture and State Management."
  },
  {
    title: "Web Development & WordPress",
    duration: "8 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description: "The fastest way to monetize. Learn to build business websites and landing pages that clients pay for. Perfect for freelancers and agencies."
  },
  {
    title: "AI-Assisted Development",
    duration: "4 Weeks",
    sessions: "2× Weekly",
    level: "Intermediate",
    description: "Work 10x faster. Master AI tools to write better code, design UI, and optimize professional workflows. AI is your new co-pilot."
  }
];

const getCourseImage = (idx: number) => {
  const images = [IMAGES.placeholders.courseFlutter, IMAGES.placeholders.courseWeb, IMAGES.placeholders.courseAI];
  return images[idx] || images[0];
};

const getPathView = (idx: number): View => {
  if (idx === 0) return 'path-flutter';
  if (idx === 1) return 'path-web';
  return 'path-ai';
};

const Courses: React.FC<CoursesProps> = ({ onNavigate }) => {
  return (
    <section id="courses" className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 text-center lg:text-left">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="md:w-2/3">
            <h2 className="text-3xl md:text-5xl font-black text-blue-900 dark:text-white mb-4 tracking-tight">Master Your Craft.</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">Structured learning designed for real-world impact. Pick your path.</p>
          </div>
          <button 
            onClick={() => onNavigate('curriculums')}
            className="text-teal-600 dark:text-teal-400 font-bold flex items-center hover:text-teal-700 dark:hover:text-teal-300 transition-colors mx-auto md:mx-0"
          >
            Explore All Paths
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {sampleCourses.map((course, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-2xl transition-all group">
              <div className="h-56 bg-blue-900 relative overflow-hidden">
                <img 
                  src={getCourseImage(idx)} 
                  alt={course.title} 
                  className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest">
                  {course.level}
                </div>
              </div>
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-blue-900 dark:text-white leading-tight">{course.title}</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[9px] uppercase font-black text-slate-400 mb-1">Duration</p>
                    <p className="text-xs font-bold text-blue-900 dark:text-slate-200">{course.duration}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[9px] uppercase font-black text-slate-400 mb-1">Live Classes</p>
                    <p className="text-xs font-bold text-blue-900 dark:text-slate-200">{course.sessions}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => onNavigate(getPathView(idx))}
                    className="w-full py-4 bg-blue-900 dark:bg-slate-700 text-white font-black rounded-2xl shadow-lg hover:bg-blue-800 dark:hover:bg-slate-600 transition-all text-sm"
                  >
                    View Syllabus
                  </button>
                  <button 
                    onClick={() => onNavigate('registration', course.title)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl shadow-lg transition-all text-sm"
                  >
                    Join Cohort — ₦10k/wk
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;
