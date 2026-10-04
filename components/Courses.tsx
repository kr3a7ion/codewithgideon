// components/Courses.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLink, Section, SectionHeader, Tag, mbtn } from "../src/marketing/ui";
import { trackCta } from "../src/marketing/analytics";
import { upcomingCohortLabel, useContactLinks } from "../src/marketing/useContactLinks";
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
  /** "₦10,000 / week" when the course has a weekly price. */
  weeklyPrice?: string;
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
  const { whatsapp, nextCohortDate } = useContactLinks();
  const cohortStarts = upcomingCohortLabel(nextCohortDate);

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
          weeklyPrice:
            Number((c as any).pricePerWeek) > 0
              ? `₦${Number((c as any).pricePerWeek).toLocaleString("en-NG")}`
              : undefined,
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
    <Section id="courses" tone="page" labelledBy="cohorts-title">
      <SectionHeader
        id="cohorts-title"
        eyebrow="Learn"
        tone="learn"
        title="Choose your path."
        description="Every path runs as a live cohort with Gideon. Pick one, pay for the weeks you want, and join the next class."
        action={<ArrowLink to="/courses">All courses</ArrowLink>}
      />
      {/* Admin → Settings → Home page → Next cohort start date */}
      {cohortStarts ? (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-50 py-1.5 pl-3 pr-3.5 text-[13px] font-bold leading-[18px] text-teal-700 dark:bg-teal-950 dark:text-teal-200">
          <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden />
          Enrolling now · next cohort starts {cohortStarts}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-[20px] border border-line bg-white dark:border-line-dark dark:bg-slate-900">
              <div className="h-40 bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-3 p-6">
                <div className="h-6 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-line bg-paper px-6 py-10 text-center dark:border-line-dark dark:bg-paper-dark">
          <h3 className="font-display text-xl font-semibold text-blue-900 dark:text-white">The next cohort is being prepared</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            See all paths, or message Gideon on WhatsApp to hear when the next cohort opens.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/courses" className={mbtn({ kind: "learn" })}>
              See all paths
            </Link>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary" })}>
              Ask on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayCourses.map((course) => {
            const resolvedPathTitle = (course.pathId && pathTitleById.get(course.pathId)) || course.title;
            const meta = [course.duration, course.sessions].filter(Boolean).join(" · ");
            return (
              <article key={course.id} className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-card dark:border-line-dark dark:bg-slate-900">
                <div className="relative h-40 overflow-hidden bg-blue-900">
                  <img src={course.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-4 top-4">
                    <Tag>{course.level}</Tag>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-6">
                  <h3 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{course.title}</h3>
                  <p className="line-clamp-3 flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{course.description}</p>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {meta ? <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{meta}</p> : <span />}
                    {course.weeklyPrice ? (
                      <p className="whitespace-nowrap">
                        <span className="font-display text-lg font-semibold text-blue-900 dark:text-white">{course.weeklyPrice}</span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400"> / week</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        course.courseId ? onNavigate("course-detail", { courseId: course.courseId, title: course.title }) : onNavigate(course.syllabusView)
                      }
                      className={mbtn({ kind: "secondary", full: true, tight: true })}
                    >
                      Syllabus
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        trackCta("join_cohort", "cohorts");
                        onNavigate("create-account", toRegistrationParam(course, resolvedPathTitle));
                      }}
                      className={mbtn({ kind: "learn", full: true, tight: true })}
                    >
                      Join cohort
                    </button>
                  </div>
                  {course.weeklyPrice ? null : <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{course.priceLabel}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
};

export default Courses;
