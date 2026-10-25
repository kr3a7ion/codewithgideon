import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePageMeta } from "../src/app/usePageMeta";
import { View } from "../src/App";
import { IMAGES } from "../assets/images";
import { ArrowRight, ChevronRight, FolderOpen, MessageSquare, MonitorPlay, Video } from "lucide-react";
import {
  ArrowLink,
  CheckItem,
  Eyebrow,
  FaqList,
  Section,
  SectionHeader,
  Tag,
  WhatsAppIcon,
  container,
  mbtn,
} from "../src/marketing/ui";
import { JOIN_FAQ, LEARN_FAQ } from "../src/marketing/content";
import { upcomingCohortLabel, useContactLinks } from "../src/marketing/useContactLinks";
import { trackCta, trackWhatsApp } from "../src/marketing/analytics";
import { usePortfolio } from "../src/marketing/useCatalog";
import { ProjectCard, projectsForCourse } from "../src/marketing/portfolio";
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

const INCLUDED = [
  { icon: MonitorPlay, title: "Live classes", body: "Taught live with Gideon. Ask questions as we build." },
  { icon: Video, title: "Every class recorded", body: "Rewatch any class in your dashboard or the app." },
  { icon: MessageSquare, title: "Mentor chat", body: "Stuck? Send a message and a screenshot of the error." },
  { icon: FolderOpen, title: "Resources and community", body: "Slides, files and a group with the rest of your cohort." },
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
  const { items: projects } = usePortfolio();
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

  const { whatsapp, nextCohortDate } = useContactLinks();
  const nextCohort = upcomingCohortLabel(nextCohortDate);

  if (loading) {
    return (
      <section className="bg-paper dark:bg-paper-dark" aria-busy="true" aria-label="Loading course">
        <div className={`${container} grid gap-10 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_480px]`}>
          <div className="space-y-5">
            <div className="h-6 w-40 animate-pulse rounded-full bg-white dark:bg-slate-800" />
            <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
              ))}
            </div>
          </div>
          <div className="aspect-[4/3] animate-pulse rounded-[28px] bg-white dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <Section tone="paper">
        <div className="mx-auto max-w-[640px] text-center">
          <Eyebrow tone="learn" className="justify-center">Course not found</Eyebrow>
          <h1 className="mt-4 font-display text-[34px] font-bold leading-10 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[44px] sm:leading-[50px]">
            This course isn&rsquo;t available.
          </h1>
          <p className="mt-4 text-base leading-[26px] text-slate-600 dark:text-slate-300">
            It may have been unpublished or moved. Pick one of the current courses.
          </p>
          <Link to="/courses" className={mbtn({ kind: "learn", size: "lg", className: "mt-7" })}>
            See the courses <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </Section>
    );
  }

  const weeks = parseWeeks(course);
  const weeklyRate = Number(course.pricePerWeek || 0);
  const priceLabel = weeklyRate > 0 ? `${currency(weeklyRate)} / week` : course.priceLabel || "At sign-up";
  const enrolmentKey = course.source === "firestore" ? `cid:${course.id}` : course.title;
  const related = projectsForCourse(projects, `${course?.title || ""} ${token}`);
  const join = () => {
    trackCta("join_cohort", "cohorts");
    onNavigate("create-account", enrolmentKey);
  };

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="course-title">
        <div className={`${container} grid items-center gap-10 pb-12 pt-7 sm:pb-16 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-14`}>
          <div className="space-y-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <li>
                  <Link to="/courses" className="hover:text-blue-900 hover:underline dark:hover:text-white">
                    Courses
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li aria-current="page" className="truncate text-blue-900 dark:text-white">
                  {course.title}
                </li>
              </ol>
            </nav>
            <div className="flex flex-wrap gap-2">
              <Tag tone="learn">Live cohort</Tag>
              {course.level ? <Tag>{course.level}</Tag> : null}
              <Tag>{weeks} weeks</Tag>
            </div>
            <h1
              id="course-title"
              className="font-display text-[38px] font-bold leading-[42px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[52px] sm:leading-[56px] lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.025em]"
            >
              {course.title}
            </h1>
            {course.description ? (
              <p className="max-w-[620px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{course.description}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Length", course.duration || `${weeks} weeks`],
                ["Classes", course.sessions || "Live online"],
                ["Price", priceLabel],
                ["Next cohort", nextCohort ? `Starts ${nextCohort}` : "Enrolling now"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-line bg-white px-4 py-3 dark:border-line-dark dark:bg-slate-900">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-1 font-display text-[15px] font-bold leading-5 text-blue-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {weeklyRate > 0 ? (
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Pay week by week. The whole course is {weeks} × {currency(weeklyRate)} = <strong className="text-blue-900 dark:text-white">{currency(weeks * weeklyRate)}</strong>.
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={join} className={mbtn({ kind: "learn", size: "lg" })}>
                Join the next cohort <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
              <a href="#course-syllabus" className={mbtn({ kind: "secondary", size: "lg" })}>
                See the weekly plan
              </a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp("cohorts")} className={mbtn({ kind: "ghost", size: "lg" })}>
                <WhatsAppIcon className="h-5 w-5" /> Ask a question
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-800 to-teal-700 shadow-lift sm:rounded-[28px]">
            <img
              src={course.imageUrl || IMAGES.placeholders.courseFlutter}
              alt=""
              className="aspect-[4/3] w-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className={`${container} pt-6`}>
          <p className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100">
            {error}
          </p>
        </div>
      ) : null}

      <Section id="course-syllabus" tone="page" labelledBy="syllabus-title" className="scroll-mt-20">
        <SectionHeader
          id="syllabus-title"
          eyebrow="Weekly plan"
          tone="learn"
          title="What you'll learn, week by week."
          description="Each week ends with something working. The plan may shift a little as the cohort goes."
        />
        {syllabus.length === 0 ? (
          <div className="mt-10 rounded-[20px] border border-line bg-paper p-8 text-center dark:border-line-dark dark:bg-paper-dark">
            <h3 className="font-display text-xl font-semibold text-blue-900 dark:text-white">The weekly plan is coming soon</h3>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Message Gideon on WhatsApp if you&rsquo;d like the outline now.</p>
          </div>
        ) : (
          <ol className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
            {syllabus.map((week) => (
              <li key={`${week.week}-${week.title}`} className="rounded-[20px] border border-line bg-white p-6 dark:border-line-dark dark:bg-slate-900">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-display text-base font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {week.week}
                  </span>
                  <h3 className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
                    <span className="sr-only">Week {week.week}: </span>
                    {week.title}
                  </h3>
                </div>
                {week.topics.length ? (
                  <ul className="mt-4 space-y-2 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                    {week.topics.map((topic) => (
                      <CheckItem key={topic} tone="learn">
                        {topic}
                      </CheckItem>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Details are shared before this week starts.</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section tone="paper" labelledBy="included-title">
        <SectionHeader id="included-title" eyebrow="What you get" tone="learn" title="Everything you need to keep up." />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {INCLUDED.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6 dark:border-line-dark dark:bg-slate-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950">
                <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold text-blue-900 dark:text-white">{title}</h3>
              <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {related.length ? (
        <Section tone="page" labelledBy="course-build">
          <SectionHeader
            id="course-build"
            eyebrow="Portfolio"
            title="See what you could build."
            description="Real projects built with the tools this course teaches."
            action={<ArrowLink to="/portfolio">Full portfolio</ArrowLink>}
          />
          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} location="cohorts" />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone={related.length ? "paper" : "page"} labelledBy="course-faq">
        <SectionHeader id="course-faq" eyebrow="FAQ" title="Before you join." />
        <div className="mt-10 grid gap-3 lg:grid-cols-2 lg:gap-6">
          <FaqList items={LEARN_FAQ} />
          <FaqList items={JOIN_FAQ} defaultOpen={-1} />
        </div>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-blue-900 p-6 text-white dark:bg-blue-950 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-[22px] font-semibold leading-7">Ready to start?</p>
            <p className="mt-1 text-sm text-slate-300">
              {nextCohort ? `The next cohort starts ${nextCohort}.` : "Sign up now and you'll join the next cohort."} Pay for the first weeks and you&rsquo;re in.
            </p>
          </div>
          <button type="button" onClick={join} className={mbtn({ kind: "learn", size: "lg", className: "shrink-0" })}>
            Join the next cohort <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </Section>
    </>
  );
};

export default CourseDetail;
