import React from 'react';
import { Course } from '../types';
import { IMAGES } from '../assets/images';
import { View } from '../App';

interface CoursesProps {
  onNavigate: (view: View) => void;
}

const sampleCourses: Course[] = [
  {
    title: "Flutter & Mobile App Development",
    duration: "12 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description: "Our flagship program. Go from zero to publishing production-grade mobile apps on iOS and Android. Master Clean Architecture and State Management. Outcome: Build and publish real mobile apps."
  },
  {
    title: "Web Development & WordPress (Practical Track)",
    duration: "8 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description: "The fastest way to monetize. Learn to build business websites and landing pages that clients pay for. Perfect for freelancers. Outcome: Deploy and monetize high-performance websites."
  },
  {
    title: "AI-Assisted Development & Productivity",
    duration: "4 Weeks",
    sessions: "2× Weekly",
    level: "Intermediate",
    description: "Work 10x faster. Master AI tools to write better code, design UI, and optimize professional workflows. Not about building AI—about using it to win. Outcome: Become a high-speed developer."
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
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-white mb-4">Master Your Craft with 3 Powerful Paths</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">Structured learning designed for real-world impact. All learning happens within our high-performance mobile app.</p>
          </div>
          <button 
            onClick={() => onNavigate('curriculums')}
            className="text-teal-600 dark:text-teal-400 font-bold flex items-center hover:text-teal-700 dark:hover:text-teal-300 transition-colors mx-auto md:mx-0"
          >
            Explore All Curriculums
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sampleCourses.map((course, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-xl transition-all group">
              <div className="h-48 bg-blue-900 relative">
                <img 
                  src={getCourseImage(idx)} 
                  alt={course.title} 
                  className="w-full h-full object-cover opacity-60 dark:opacity-40 group-hover:scale-105 transition-transform duration-500"
                />
                {idx === 0 && (
                  <div className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter shadow-lg">
                    Flagship Path
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-blue-900 dark:text-teal-400 uppercase">
                  {course.level}
                </div>
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-4 leading-tight">{course.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed h-24 overflow-hidden">{course.description}</p>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-700 pt-6">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-blue-900 dark:text-slate-200">{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Live Sessions</p>
                    <p className="text-sm font-semibold text-blue-900 dark:text-slate-200">{course.sessions}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700">
                <button 
                  onClick={() => onNavigate(getPathView(idx))}
                  className="block w-full text-center bg-white dark:bg-slate-700 border border-blue-900 dark:border-teal-600 text-blue-900 dark:text-teal-400 font-bold py-3 rounded-lg hover:bg-blue-900 dark:hover:bg-teal-600 hover:text-white dark:hover:text-white transition-all shadow-sm"
                >
                  Enroll in this Path
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;