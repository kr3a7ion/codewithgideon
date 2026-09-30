import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePageMeta } from "../src/app/usePageMeta";
import { View } from "../src/App";
import { IMAGES } from "../assets/images";
import { ArrowLink, SectionHeader, WorkCard } from "../src/marketing/ui";
import { WORK } from "../src/marketing/content";
import {
  CourseDoc,
  SyllabusWeek,
  registrationStore,
} from "../services/registrationStore";
import {
  courseTokenFromPathname,
  legacyCourseSlugs,
  slugifyCourse,
} from "../utils/courseRoutes";

interface CourseDetailProps {
  onNavigate: (view: View, path?: string) => void;
}

type DetailCourse = CourseDoc & {
  source?: "firestore" | "fallback";
};

const fallbackCourses: DetailCourse[] = [
  {
    id: "flutter-mobile-app-development",
    source: "fallback",
    title: "Flutter & Mobile App Development",
    duration: "12 Weeks",
    sessions: "3 Days / Week",
    level: "Beginner",
    description:
      "Go from Dart basics to publishing real-world iOS and Android applications with professional state management.",
    priceLabel: "Pricing at enrollment",
    imageUrl: IMAGES.placeholders.courseFlutter,
    syllabusView: "path-flutter",
    weeks: 12,
    pricePerWeek: 0,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    syllabus: [
      {
        week: 1,
        title: "Foundations",
        topics: [
          "Flutter overview and setup",
          "Dart fundamentals",
          "Widgets and UI basics",
          "Stateless vs Stateful widgets",
        ],
      },
      {
        week: 2,
        title: "UI, Input and Navigation",
        topics: [
          "Layout system",
          "Forms and validation",
          "Navigation and data passing",
          "Local state with setState",
        ],
      },
      {
        week: 3,
        title: "Backend and Authentication",
        topics: [
          "Firebase setup",
          "Authentication",
          "Firestore basics",
          "Real-time data",
        ],
      },
      {
        week: 4,
        title: "Architecture and Final Project",
        topics: [
          "State management",
          "REST APIs",
          "Debugging",
          "Android build and presentation",
        ],
      },
    ],
  },
  {
    id: "web-development-wordpress",
    source: "fallback",
    title: "Web Development & WordPress",
    duration: "6 Weeks",
    sessions: "3 Days / Week",
    level: "Beginner",
    description:
      "Build business websites, landing pages, blogs, and portfolio sites with a practical client-ready workflow.",
    priceLabel: "Pricing at enrollment",
    imageUrl: IMAGES.placeholders.courseWeb,
    syllabusView: "path-web",
    weeks: 6,
    pricePerWeek: 0,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    syllabus: [
      {
        week: 1,
        title: "WordPress Foundations",
        topics: [
          "WordPress.com vs WordPress.org",
          "Domain and hosting basics",
          "Installation",
          "Dashboard overview",
        ],
      },
      {
        week: 2,
        title: "Themes and Site Structure",
        topics: ["Themes", "Pages", "Menus", "Permalinks and settings"],
      },
      {
        week: 3,
        title: "Content and Plugins",
        topics: ["Posts vs Pages", "Media", "Essential plugins", "Forms"],
      },
      {
        week: 4,
        title: "Business Website Launch",
        topics: ["Landing pages", "SEO basics", "Security", "Final website"],
      },
    ],
  },
  {
    id: "ai-assisted-development",
    source: "fallback",
    title: "AI-Assisted Development",
    duration: "4 Weeks",
    sessions: "2 Days / Week",
    level: "Intermediate",
    description:
      "Learn to use AI like a serious developer: plan better, debug faster, and verify every result with confidence.",
    priceLabel: "Pricing at enrollment",
    imageUrl: IMAGES.placeholders.courseAI,
    syllabusView: "path-ai",
    weeks: 4,
    pricePerWeek: 0,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    syllabus: [
      {
        week: 1,
        title: "AI Foundations",
        topics: ["Prompting basics", "Verification mindset", "Good questions"],
      },
      {
        week: 2,
        title: "Coding and Debugging",
        topics: ["Explain errors", "Refactor code", "Compare logic paths"],
      },
      {
        week: 3,
        title: "UI, UX and Planning",
        topics: ["Layout review", "Accessibility checks", "Task breakdown"],
      },
      {
        week: 4,
        title: "Responsible Product Workflow",
        topics: ["Release copy", "Documentation", "Avoiding dependency"],
      },
    ],
  },
];

const parseWeeks = (course: DetailCourse) => {
  if (Number(course.weeks) > 0) return Math.floor(Number(course.weeks));
  const fromDuration = parseInt(String(course.duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(fromDuration) && fromDuration > 0 ? fromDuration : 4;
};

const currency = (value?: number) =>
  Number(value || 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

const resolveCourse = (token: string, courses: CourseDoc[]) => {
  const cleanToken = slugifyCourse(token);
  const legacyView = Object.entries(legacyCourseSlugs).find(
    ([, slug]) => slug === cleanToken,
  )?.[0];

  const activeCourses = courses.filter((course: any) => course.isActive !== false);
  const match = activeCourses.find((course: any) => {
    const id = String(course.id || "").trim();
    const titleSlug = slugifyCourse(course.title || "");
    const view = String(course.syllabusView || "").trim();
    return (
      id === token ||
      slugifyCourse(id) === cleanToken ||
      titleSlug === cleanToken ||
      view === token ||
      view === legacyView
    );
  });

  if (match) return { ...match, source: "firestore" as const };

  return fallbackCourses.find((course) => {
    const titleSlug = slugifyCourse(course.title);
    const view = String(course.syllabusView || "").trim();
    return course.id === cleanToken || titleSlug === cleanToken || view === legacyView;
  });
};

const CourseDetail: React.FC<CourseDetailProps> = ({ onNavigate }) => {
  const location = useLocation();
  const token = courseTokenFromPathname(location.pathname);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await registrationStore.getCourses();
        if (!mounted) return;
        setCourses(list || []);
      } catch (err) {
        console.error("Failed to load course detail:", err);
        if (!mounted) return;
        setCourses([]);
        setError("We could not refresh this course right now. Showing the saved outline.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const course = useMemo(
    () => resolveCourse(token, courses) || null,
    [courses, token],
  );

  usePageMeta({
    title: course?.title || "Course",
    description: course?.description
      ? String(course.description).slice(0, 160)
      : undefined,
  });

  const syllabus = useMemo<SyllabusWeek[]>(() => {
    const list = Array.isArray(course?.syllabus) ? course?.syllabus : [];
    return list
      .filter(Boolean)
      .map((week, idx) => ({
        week: Number(week.week) > 0 ? Number(week.week) : idx + 1,
        title: String(week.title || `Week ${idx + 1}`).trim(),
        topics: Array.isArray(week.topics)
          ? week.topics.map((topic) => String(topic).trim()).filter(Boolean)
          : [],
      }));
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-96 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
            Course not found
          </p>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white">
            This course is not available yet.
          </h1>
          <p className="mt-5 text-slate-600 dark:text-slate-300">
            It may have been unpublished or moved. Explore the current active
            courses and pick the one that fits your path.
          </p>
          <button
            onClick={() => onNavigate("curriculums")}
            className="mt-8 rounded-2xl bg-blue-900 px-8 py-4 font-black text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            View Active Courses
          </button>
        </div>
      </div>
    );
  }

  const weeks = parseWeeks(course);
  const weeklyRate = Number(course.pricePerWeek || 0);
  const priceLabel = weeklyRate > 0 ? `${currency(weeklyRate)}/week` : course.priceLabel;
  const enrolmentKey = course.source === "firestore" ? `cid:${course.id}` : course.title;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl px-6">
        <button
          onClick={() => onNavigate("curriculums")}
          className="mb-8 inline-flex items-center text-sm font-black uppercase tracking-widest text-slate-500 transition hover:text-blue-900 dark:hover:text-teal-400"
        >
          <span className="mr-2">←</span>
          Back to courses
        </button>

        {error && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[2.5rem] bg-blue-950 p-6 shadow-2xl dark:bg-slate-900 md:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-teal-100">
                {course.level || "Course"} · {weeks} weeks
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
                {course.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/90">
                {course.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Duration", course.duration || `${weeks} Weeks`],
                  ["Classes", course.sessions || "Live sessions"],
                  ["Investment", priceLabel || "See enrollment"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/60">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => onNavigate("create-account", enrolmentKey)}
                  className="rounded-2xl bg-teal-500 px-8 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-400"
                >
                  Enroll Now
                </button>
                <button
                  onClick={() => {
                    document
                      .getElementById("course-syllabus")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-sm font-black text-white transition hover:bg-white/15"
                >
                  See Weekly Plan
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-teal-400/20 blur-sm" />
              <img
                src={course.imageUrl || IMAGES.placeholders.courseFlutter}
                alt={course.title}
                className="relative h-[340px] w-full rounded-[2rem] object-cover shadow-2xl"
              />
            </div>
          </div>
        </section>

        <section id="course-syllabus" className="scroll-mt-28 pt-16">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
                Curriculum
              </p>
              <h2 className="mt-3 text-3xl font-black text-blue-950 dark:text-white">
                Weekly breakdown
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Each week is designed to unlock a practical milestone, not just
              another lecture. The outline may be adjusted as the cohort
              progresses.
            </p>
          </div>

          {syllabus.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-black text-blue-950 dark:text-white">
                Syllabus coming soon
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                This course is active, but the weekly syllabus has not been
                published yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {syllabus.map((week) => (
                <article
                  key={`${week.week}-${week.title}`}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-sm font-black text-white dark:bg-teal-500">
                      {week.week}
                    </div>
                    <h3 className="text-lg font-black text-blue-950 dark:text-white">
                      {week.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {week.topics.length > 0 ? (
                      week.topics.map((topic) => (
                        <li
                          key={topic}
                          className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
                        >
                          <span className="mt-2 h-2 w-2 rounded-full bg-teal-500" />
                          <span>{topic}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500 dark:text-slate-400">
                        Details will be shared before this week starts.
                      </li>
                    )}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* The Work samples are websites, so only the web course links to them. */}
        {/web|wordpress/i.test(`${course?.title || ""} ${token}`) ? (
        <section aria-labelledby="course-build" className="mt-16 rounded-[28px] bg-paper p-5 dark:bg-paper-dark sm:p-8 lg:p-10">
          <SectionHeader
            id="course-build"
            eyebrow="Work"
            title="See what you’ll build."
            description="Sample booking sites for the kind of businesses web learners build for. Try the live demos."
            action={<ArrowLink to="/work">See all work</ArrowLink>}
          />
          <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
            {WORK.map((w) => (
              <WorkCard key={w.slug} work={w} location="cohorts" />
            ))}
          </div>
        </section>
        ) : null}
      </div>
    </div>
  );
};

export default CourseDetail;
