// components/Courses.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Course } from "../types";
import { IMAGES } from "../assets/images";
import { View } from "../src/App";
import {
  registrationStore,
  CourseDoc,
  PathDoc,
} from "../services/registrationStore";

interface CoursesProps {
  // ✅ keep legacy signature so the whole app doesn’t break
  onNavigate: (view: View, path?: any) => void;
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
  source: "sample" | "firestore";

  // ✅ pathId/courseId for clean registration routing
  pathId?: string;
  courseId?: string;
};

const Courses: React.FC<CoursesProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<CourseDoc[] | null>(null);
  const [paths, setPaths] = useState<PathDoc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [courseList, pathList] = await Promise.all([
        registrationStore.getCourses(),
        registrationStore.getPaths(false), // active only
      ]);

      const activeCourses = (courseList || []).filter(
        (c: any) => c.isActive !== false && (c as any).showOnLanding !== false,
      );

      setCourses(activeCourses);
      setPaths(pathList || []);
    } catch (e) {
      console.error("Failed to load courses/paths:", e);
      setCourses(null);
      setPaths(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const pathTitleById = useMemo(() => {
    const map = new Map<string, string>();
    (paths || []).forEach((p) => map.set(p.id, String(p.title || "").trim()));
    return map;
  }, [paths]);

  const displayCourses: DisplayCourse[] = useMemo(() => {
    const base: DisplayCourse[] = sampleCourses.map((c, idx) => ({
      id: `sample-${idx}`,
      ...c,
      priceLabel: "Pricing at enrollment",
      imageUrl: fallbackImageByIndex(idx),
      syllabusView: defaultSyllabusViewByTitle(c.title),
      source: "sample",
      pathId: undefined,
      courseId: undefined,
    }));

    const firebaseCourses: DisplayCourse[] = (courses || [])
      .filter((c: any) => String(c.title || "").trim().length > 0)
      .map((c, idx) => {
        const cid = String(c.id || "").trim();
        const pid = c.pathId ? String(c.pathId).trim() : undefined;

        const displayTitle = String(c.title || "").trim();

        return {
          id: cid || `firestore-${idx}`,
          title: displayTitle,
          duration: String(c.duration || "").trim(),
          sessions: String(c.sessions || "").trim(),
          level: String(c.level || "").trim() || "Beginner",
          description: String(c.description || "").trim(),
          priceLabel:
            String(c.priceLabel || "").trim() || "Pricing at enrollment",
          imageUrl:
            String(c.imageUrl || "").trim() || fallbackImageByIndex(idx + 3),
          syllabusView: ((c.syllabusView as View) ||
            defaultSyllabusViewByTitle(displayTitle)) as View,
          source: "firestore",
          pathId: pid,
          courseId: cid || undefined,
        };
      });

    if (firebaseCourses.length > 0) return firebaseCourses;
    return loadFailed ? base : [];
  }, [courses, loadFailed]);

  // ✅ keep App routing unchanged: pass ONE string
  // Registration can parse it:
  // - "pid:<pathId>" (preferred)
  // - fallback to title if no pathId
  const toRegistrationParam = (
    course: DisplayCourse,
    resolvedPathTitle: string,
  ) =>
    course.courseId
      ? `cid:${course.courseId}`
      : course.pathId
        ? `pid:${course.pathId}`
        : resolvedPathTitle;

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

          <button
            onClick={() => onNavigate("curriculums")}
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
        ) : displayCourses.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-12 text-center shadow-xl dark:border-slate-800 dark:bg-slate-800">
            <h3 className="text-2xl font-black text-blue-900 dark:text-white">
              Courses are being prepared
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              No courses are currently set to show on the homepage. Explore all
              paths or check back soon for the next cohort opening.
            </p>
            <button
              onClick={() => onNavigate("curriculums")}
              className="mt-6 rounded-2xl bg-blue-900 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Explore Paths
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {displayCourses.map((course, idx) => {
              const resolvedPathTitle =
                (course.pathId && pathTitleById.get(course.pathId)) ||
                course.title;

              return (
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
                      <button
                        onClick={() =>
                          course.courseId
                            ? onNavigate("course-detail", {
                                courseId: course.courseId,
                                title: course.title,
                              })
                            : onNavigate(course.syllabusView)
                        }
                        className="w-full py-4 bg-blue-900 dark:bg-slate-700 text-white font-black rounded-2xl shadow-lg hover:bg-blue-800 dark:hover:bg-slate-600 transition-all text-sm"
                      >
                        View Syllabus
                      </button>

                      {/* ✅ pathId-first, but passed via `path` param to avoid breaking App.tsx */}
                      <button
                        onClick={() =>
                          onNavigate(
                            "create-account",
                            toRegistrationParam(course, resolvedPathTitle),
                          )
                        }
                        className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl shadow-lg transition-all text-sm"
                      >
                        Join Cohort — {course.priceLabel}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;
