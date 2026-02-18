import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import { IMAGES } from "../assets/images";
import { registrationStore, CourseDoc } from "../services/registrationStore";

interface CurriculumsProps {
  onNavigate: (view: View, path?: string) => void;
}

type DisplayPath = {
  id: View;
  title: string;
  duration: string;
  focus: string;
  image: string;
  description: string;
  accent: string;
  priceLabel?: string;
  syllabusView?: View;
  source: "pinned" | "firestore";
};

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

const Curriculums: React.FC<CurriculumsProps> = ({ onNavigate }) => {
  const pinned: DisplayPath[] = [
    {
      id: "path-flutter" as View,
      title: "Flutter & Mobile App Development",
      duration: "12 Weeks",
      focus: "Beginner → Mobile Dev",
      image: IMAGES.placeholders.courseFlutter,
      description:
        "The complete journey from Dart basics to publishing real-world iOS and Android applications with professional state management.",
      accent: "border-teal-500",
      priceLabel: "₦10k/wk",
      syllabusView: "path-flutter",
      source: "pinned",
    },
    {
      id: "path-web" as View,
      title: "Web Development & WordPress",
      duration: "6 Weeks",
      focus: "Monetize Fast",
      image: IMAGES.placeholders.courseWeb,
      description:
        "A practical track designed to help you build and sell client-ready websites. Master themes, plugins, and professional deployment.",
      accent: "border-blue-500",
      priceLabel: "₦10k/wk",
      syllabusView: "path-web",
      source: "pinned",
    },
    {
      id: "path-ai" as View,
      title: "AI-Assisted Development",
      duration: "4 Weeks",
      focus: "Productivity & Flow",
      image: IMAGES.placeholders.courseAI,
      description:
        "Learn to use AI tools like a senior developer. Optimize your workflow, debug faster, and build better products with AI as your co-pilot.",
      accent: "border-orange-500",
      priceLabel: "₦10k/wk",
      syllabusView: "path-ai",
      source: "pinned",
    },
  ];

  const [dbCourses, setDbCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await registrationStore.getCourses();
      const active = (list || []).filter((c) => c.isActive !== false);
      setDbCourses(active);
    } catch (e) {
      console.error("Failed to load firestore courses:", e);
      setDbCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const merged: DisplayPath[] = useMemo(() => {
    const pinnedTitles = new Set(
      pinned.map((p) => p.title.trim().toLowerCase()),
    );

    // Firestore courses that are NOT duplicates of the pinned 3
    const extras: DisplayPath[] = dbCourses
      .filter(
        (c) =>
          !pinnedTitles.has(
            String(c.title || "")
              .trim()
              .toLowerCase(),
          ),
      )
      .map((c, idx) => {
        const syllabusView = ((c.syllabusView as View) ||
          defaultSyllabusViewByTitle(c.title)) as View;

        return {
          id: "curriculums" as View, // stays on this page unless it matches known views
          title: c.title,
          duration: c.duration,
          focus: c.level || "Course",
          image: c.imageUrl || fallbackImageByIndex(idx + 3),
          description: c.description,
          accent: "border-slate-200 dark:border-slate-700", // neutral accent to keep look consistent
          priceLabel: c.priceLabel || "₦10k/wk",
          syllabusView,
          source: "firestore",
        };
      });

    return [...pinned, ...extras];
  }, [dbCourses]);

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <button
            onClick={() => onNavigate("home")}
            className="text-slate-500 hover:text-blue-900 dark:hover:text-teal-400 mb-8 inline-flex items-center text-sm font-bold uppercase tracking-widest"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>

          <h1 className="text-4xl md:text-6xl font-black text-blue-900 dark:text-white mb-6">
            Choose Your Path.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Each curriculum is designed to be practical, structured, and
            instructor-led.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-2xl animate-pulse"
              >
                <div className="h-52 bg-slate-200 dark:bg-slate-800" />
                <div className="p-8 space-y-4">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="space-y-3 pt-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {merged.map((path) => (
              <div
                key={`${path.source}-${path.title}`}
                className={`bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 ${path.accent} shadow-2xl flex flex-col hover:translate-y-[-8px] transition-all duration-300 group`}
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={path.image}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                    alt={path.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
                  <div className="absolute bottom-6 left-6">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-900/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                      {path.focus}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-black text-blue-900 dark:text-white leading-tight">
                      {path.title}
                    </h2>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                    {path.description}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() =>
                        onNavigate(path.syllabusView || "curriculums")
                      }
                      className="w-full py-4 bg-blue-900 dark:bg-slate-800 text-white font-black rounded-2xl shadow-lg hover:bg-blue-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      View Syllabus
                    </button>

                    <button
                      onClick={() => onNavigate("registration", path.title)}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      Enroll Now —{" "}
                      {path.priceLabel
                        ? path.priceLabel.replace("/wk", "")
                        : "₦10k"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optional: tiny friendly note when no firestore courses */}
        {!loading && dbCourses.length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-10">
            Admin-added courses will appear here once you create them in the
            dashboard.
          </p>
        )}
      </div>
    </div>
  );
};

export default Curriculums;
