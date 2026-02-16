import React, { useEffect, useMemo, useState } from "react";
import { Course } from "../types";
import { IMAGES } from "../assets/images";
import { View } from "../src/App";
import { registrationStore, CourseDoc } from "../services/registrationStore";

interface CoursesProps {
  onNavigate: (view: View, path?: string) => void;
}

const sampleCourses: Course[] = [
  {
    title: "Flutter & Mobile App Development",
    duration: "12 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description:
      "Our flagship program. Go from zero to publishing production-grade mobile apps on iOS and Android. Master Clean Architecture and State Management.",
  },
  {
    title: "Web Development & WordPress",
    duration: "8 Weeks",
    sessions: "3× Weekly",
    level: "Beginner",
    description:
      "The fastest way to monetize. Learn to build business websites and landing pages that clients pay for. Perfect for freelancers and agencies.",
  },
  {
    title: "AI-Assisted Development",
    duration: "4 Weeks",
    sessions: "2× Weekly",
    level: "Intermediate",
    description:
      "Work 10x faster. Master AI tools to write better code, design UI, and optimize professional workflows. AI is your new co-pilot.",
  },
];

const fallbackImageByIndex = (idx: number) => {
  const images = [
    IMAGES.placeholders.courseFlutter,
    IMAGES.placeholders.courseWeb,
    IMAGES.placeholders.courseAI,
  ];
  return images[idx] || images[0];
};

const defaultSyllabusViewByTitle = (title: string): View => {
  const t = title.toLowerCase();
  if (t.includes("flutter")) return "path-flutter";
  if (t.includes("word") || t.includes("web")) return "path-web";
  if (t.includes("ai")) return "path-ai";
  // fallback route if admin forgot to set syllabusView
  return "curriculums";
};

type DisplayCourse = {
  id: string;
  title: string;
  duration: string;
  sessions: string;
  level: string;
  description: string;
  priceLabel: string;
  imageUrl: string;
  syllabusView: View;
  // helpful for debugging / future enhancements
  source: "sample" | "firestore";
};

const Courses: React.FC<CoursesProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<CourseDoc[] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = await registrationStore.getCourses();
      // only show active courses
      const active = (list || []).filter((c) => c.isActive !== false);
      setCourses(active);
    } catch (e) {
      console.error("Failed to load courses:", e);
      setCourses(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const displayCourses: DisplayCourse[] = useMemo(() => {
    // Always start with your default 3
    const base: DisplayCourse[] = sampleCourses.map((c, idx) => ({
      id: `sample-${idx}`,
      ...c,
      priceLabel: "₦10k/wk",
      imageUrl: fallbackImageByIndex(idx),
      syllabusView: defaultSyllabusViewByTitle(c.title),
      source: "sample",
    }));

    // If Firebase has no courses yet → just show defaults
    if (!courses || courses.length === 0) return base;

    // Avoid duplicates: if an admin creates a course with same title as a sample
    const sampleTitles = new Set(
      sampleCourses.map((s) => s.title.trim().toLowerCase()),
    );

    // Add admin-created courses AFTER defaults
    const firebaseCourses: DisplayCourse[] = courses
      .filter(
        (c) =>
          !sampleTitles.has(
            String(c.title || "")
              .trim()
              .toLowerCase(),
          ),
      )
      .map((c, idx) => ({
        id: c.id,
        title: c.title,
        duration: c.duration,
        sessions: c.sessions,
        level: c.level,
        description: c.description,
        priceLabel: c.priceLabel || "₦10k/wk",
        imageUrl: c.imageUrl || fallbackImageByIndex(idx + 3),
        syllabusView: ((c.syllabusView as View) ||
          defaultSyllabusViewByTitle(c.title)) as View,
        source: "firestore",
      }));

    return [...base, ...firebaseCourses];
  }, [courses]);

  return (
    <section
      id="courses"
      className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-6 text-center lg:text-left">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="md:w-2/3">
            <h2 className="text-3xl md:text-5xl font-black text-blue-900 dark:text-white mb-4 tracking-tight">
              Master Your Craft.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Structured learning designed for real-world impact. Pick your
              path.
            </p>
          </div>

          {/* ✅ FIX: Explore All Paths should show everything (Firestore + pinned 3)
              Your curriculums page is hardcoded to the pinned 3, so we scroll to this section instead. */}
          <button
            onClick={() => {
              // keep UI unchanged, but ensure the user sees ALL courses that we merged here
              const el = document.getElementById("courses");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="text-teal-600 dark:text-teal-400 font-bold flex items-center hover:text-teal-700 dark:hover:text-teal-300 transition-colors mx-auto md:mx-0"
          >
            Explore All Paths
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-slate-700 animate-pulse"
              >
                <div className="h-56 bg-slate-200 dark:bg-slate-700" />
                <div className="p-8 space-y-4">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                    <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {displayCourses.map((course, idx) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-2xl transition-all group"
              >
                <div className="h-56 bg-blue-900 relative overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest">
                    {course.level}
                  </div>
                </div>

                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-blue-900 dark:text-white leading-tight">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <p className="text-[9px] uppercase font-black text-slate-400 mb-1">
                        Duration
                      </p>
                      <p className="text-xs font-bold text-blue-900 dark:text-slate-200">
                        {course.duration}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <p className="text-[9px] uppercase font-black text-slate-400 mb-1">
                        Live Classes
                      </p>
                      <p className="text-xs font-bold text-blue-900 dark:text-slate-200">
                        {course.sessions}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* ✅ Keeps your existing syllabus pages for pinned 3
                        ✅ For Firestore courses, use their syllabusView if set; else fallback to "curriculums" */}
                    <button
                      onClick={() => onNavigate(course.syllabusView)}
                      className="w-full py-4 bg-blue-900 dark:bg-slate-700 text-white font-black rounded-2xl shadow-lg hover:bg-blue-800 dark:hover:bg-slate-600 transition-all text-sm"
                    >
                      View Syllabus
                    </button>

                    {/* ✅ Keeps your current Registration behavior (expects title)
                        This ensures payment flow stays the same and UI doesn’t change.
                        Later we can upgrade to pass courseId without breaking anything. */}
                    <button
                      onClick={() => onNavigate("registration", course.title)}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl shadow-lg transition-all text-sm"
                    >
                      Join Cohort — {course.priceLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;
