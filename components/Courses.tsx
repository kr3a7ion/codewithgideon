// components/Courses.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Video, Wallet } from "lucide-react";
import { ArrowLink, Section, SectionHeader, Tag, mbtn } from "../src/marketing/ui";
import { trackCta } from "../src/marketing/analytics";
import { WHATSAPP_MESSAGES, whatsappLink } from "../src/marketing/content";
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
    <Section id="courses" tone="page" labelledBy="cohorts-title">
      <SectionHeader
        id="cohorts-title"
        eyebrow="Learn"
        tone="learn"
        title="Learn to build sites like these."
        description="Live cohort classes with Gideon: real projects and a recording of every class."
        action={
          <>
            <ArrowLink to="/work" tone="learn">
              See what you&rsquo;ll build
            </ArrowLink>
            <ArrowLink to="/courses">All courses</ArrowLink>
          </>
        }
      />

      <ul className="mt-10 grid gap-3 sm:gap-6 md:grid-cols-3">
        {[
          { icon: Video, title: "Live classes with Gideon", body: "Ask questions while the code is being written, not after." },
          { icon: Wallet, title: "Pay week by week", body: "Unlock the weeks you want. No big upfront fee." },
          { icon: Smartphone, title: "Everything in the app", body: "Classes, recordings, resources and mentor chat in one place." },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3.5 rounded-2xl bg-teal-50 p-4 dark:bg-teal-950/60 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
              <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-base font-semibold text-blue-900 dark:text-white sm:text-lg">{title}</span>
              <span className="mt-0.5 hidden text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300 sm:block">{body}</span>
            </span>
          </li>
        ))}
      </ul>

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
            <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary" })}>
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
                  {meta ? <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{meta}</p> : null}
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
                  <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{course.priceLabel}</p>
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
