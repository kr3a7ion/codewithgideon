import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import { IMAGES } from "../assets/images";
import { ArrowLink, Eyebrow, Section, SectionHeader, Tag, WorkCard, container, mbtn } from "../src/marketing/ui";
import { WORK } from "../src/marketing/content";
import { trackCta } from "../src/marketing/analytics";
import {
  registrationStore,
  CourseDoc,
  PathDoc,
} from "../services/registrationStore";

interface CurriculumsProps {
  onNavigate: (view: View, path?: any) => void;
}

type DisplayPath = {
  pathId?: string;
  courseId?: string;

  title: string;
  duration: string;
  focus: string;
  image: string;
  description: string;
  accent: string;
  priceLabel?: string;
  syllabusView?: View;
  source: "emergency" | "firestore";
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

// ✅ only allow known views; fallback safely
const safeView = (v: any): View => {
  const allowed: View[] = [
    "curriculums",
    "path-flutter",
    "path-web",
    "path-ai",
  ];
  return allowed.includes(v) ? (v as View) : "curriculums";
};

const Curriculums: React.FC<CurriculumsProps> = ({ onNavigate }) => {
  const emergencyPaths: DisplayPath[] = [
    {
      title: "Flutter & Mobile App Development",
      duration: "12 Weeks",
      focus: "Beginner → Mobile Dev",
      image: IMAGES.placeholders.courseFlutter,
      description:
        "The complete journey from Dart basics to publishing real-world iOS and Android applications with professional state management.",
      accent: "border-teal-500",
      priceLabel: "Pricing at enrollment",
      syllabusView: "path-flutter",
      source: "emergency",
    },
    {
      title: "Web Development & WordPress",
      duration: "6 Weeks",
      focus: "Monetize Fast",
      image: IMAGES.placeholders.courseWeb,
      description:
        "A practical track designed to help you build and sell client-ready websites. Master themes, plugins, and professional deployment.",
      accent: "border-blue-500",
      priceLabel: "Pricing at enrollment",
      syllabusView: "path-web",
      source: "emergency",
    },
    {
      title: "AI-Assisted Development",
      duration: "4 Weeks",
      focus: "Productivity & Flow",
      image: IMAGES.placeholders.courseAI,
      description:
        "Learn to use AI tools like a senior developer. Optimize your workflow, debug faster, and build better products with AI as your co-pilot.",
      accent: "border-orange-500",
      priceLabel: "Pricing at enrollment",
      syllabusView: "path-ai",
      source: "emergency",
    },
  ];

  const [paths, setPaths] = useState<PathDoc[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const pathsByTitle = useMemo(() => {
    const m = new Map<string, PathDoc>();
    (paths || []).forEach((p) => {
      const k = String(p.title || "")
        .trim()
        .toLowerCase();
      if (k) m.set(k, p);
    });
    return m;
  }, [paths]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const [p, list] = await Promise.all([
          registrationStore.getPaths(false), // active only
          registrationStore.getCourses(),
        ]);

        if (!mounted) return;

        setPaths(p || []);

        const activeExplore = (list || []).filter((c: any) => {
          const isActive = c.isActive !== false;
          const showInExplore = (c as any).showInExplore !== false;
          return isActive && showInExplore;
        });

        setDbCourses(activeExplore);
      } catch (e) {
        console.error("Failed to load curriculums data:", e);
        if (!mounted) return;
        setPaths([]);
        setDbCourses([]);
        setLoadFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const merged: DisplayPath[] = useMemo(() => {
    // Emergency cards are only used if Firestore cannot load at all.
    const emergencyHydrated: DisplayPath[] = emergencyPaths.map((p) => {
      const match = pathsByTitle.get(p.title.trim().toLowerCase());
      return { ...p, pathId: match?.id };
    });

    // ✅ Firestore cards (do NOT hide just because title matches pinned)
    const extras: DisplayPath[] = (dbCourses || []).map((c, idx) => {
      const rawView = (c as any).syllabusView;
      const syllabusView = safeView(
        rawView || defaultSyllabusViewByTitle(c.title),
      );

      return {
        courseId: c.id,
        pathId: (c as any).pathId ? String((c as any).pathId) : undefined,

        title: String(c.title || "Course"),
        duration: String(c.duration || "4 Weeks"),
        focus: String((c as any).level || "Course"),
        image: (c as any).imageUrl || fallbackImageByIndex(idx + 3),
        description: String(
          (c as any).description || "Course description coming soon.",
        ),
        accent: "border-slate-200 dark:border-slate-700",
        priceLabel: (c as any).priceLabel || "Pricing at enrollment",
        syllabusView,
        source: "firestore",
      };
    });

    if (extras.length > 0) return extras;
    return loadFailed ? emergencyHydrated : [];
  }, [dbCourses, emergencyPaths, loadFailed, pathsByTitle]);

  const toRegistrationParam = (p: DisplayPath) => {
    // ✅ prefer courseId/pathId truth (Registration supports cid:/pid:)
    if (p.courseId) return `cid:${p.courseId}`;
    if (p.pathId) return `pid:${p.pathId}`;

    return p.title; // legacy fallback
  };

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="learn-title">
        <div className={`${container} pb-10 pt-10 sm:pb-14 sm:pt-16`}>
          <Eyebrow tone="learn">Learn</Eyebrow>
          <h1
            id="learn-title"
            className="mt-4 max-w-[760px] font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
          >
            Learn to <span className="text-teal-600 dark:text-teal-300">build it</span>, live.
          </h1>
          <p className="mt-5 max-w-[640px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
            Pick a path. Every cohort is live with Gideon, recorded after every class, and paid for week by week.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
            <ArrowLink to="/work" tone="learn">
              See what you&rsquo;ll build
            </ArrowLink>
            <ArrowLink to="/#about">Meet your teacher</ArrowLink>
          </div>
        </div>
      </section>

      <Section tone="page" className="!pt-10 sm:!pt-14">
        <h2 className="sr-only">Paths</h2>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-[20px] border border-line bg-white dark:border-line-dark dark:bg-slate-900">
                <div className="h-48 bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-3 p-6">
                  <div className="h-6 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : merged.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-[20px] border border-line bg-paper px-6 py-10 text-center dark:border-line-dark dark:bg-paper-dark">
            <h2 className="font-display text-xl font-semibold text-blue-900 dark:text-white">Courses are being prepared</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              No courses are open for enrollment right now. Check back soon, or send a message and you&rsquo;ll hear when the next cohort starts.
            </p>
            <button type="button" onClick={() => onNavigate("contact")} className={mbtn({ kind: "learn", className: "mt-5" })}>
              Contact us
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {merged.map((path) => (
              <article
                key={`${path.source}-${path.courseId || path.pathId || path.title}`}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-card dark:border-line-dark dark:bg-slate-900"
              >
                <div className="relative h-48 overflow-hidden bg-blue-900">
                  <img src={path.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute bottom-4 left-4">
                    <Tag>{path.focus}</Tag>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{path.title}</h2>
                  <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{path.description}</p>
                  <div className="mt-2 grid gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        path.courseId
                          ? onNavigate("course-detail", { courseId: path.courseId, title: path.title })
                          : onNavigate(path.syllabusView || "curriculums")
                      }
                      className={mbtn({ kind: "secondary", full: true })}
                    >
                      View syllabus
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        trackCta("join_cohort", "cohorts");
                        onNavigate("create-account", toRegistrationParam(path));
                      }}
                      className={mbtn({ kind: "learn", full: true })}
                    >
                      Join the cohort
                    </button>
                    <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{path.priceLabel || "Pricing at enrollment"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && loadFailed && merged.length > 0 && (
          <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-center text-sm font-semibold text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-100">
            Live course data couldn&rsquo;t be reached, so a temporary course list is shown.
          </p>
        )}
      </Section>

      <Section tone="paper" labelledBy="build-title">
        <SectionHeader
          id="build-title"
          eyebrow="Work"
          title="See what you’ll build."
          description="The web cohort teaches the stack behind these sites: React, TypeScript and Tailwind, designed in Figma first. Try the live demos."
          action={<ArrowLink to="/work">See all work</ArrowLink>}
        />
        <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-2">
          {WORK.map((w) => (
            <WorkCard key={w.slug} work={w} location="cohorts" />
          ))}
        </div>
      </Section>
    </>
  );
};

export default Curriculums;
