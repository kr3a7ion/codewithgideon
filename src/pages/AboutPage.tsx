/* /about — who Gideon is, what he builds and how he teaches. */
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  LayoutDashboard,
  MessageSquare,
  MonitorPlay,
  Smartphone,
  Video,
  Wrench,
} from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { useContactLinks } from "../marketing/useContactLinks";
import { usePortfolio } from "../marketing/useCatalog";
import { ProjectCard, sortProjects } from "../marketing/portfolio";
import { SlotImage } from "../marketing/SlotImage";
import { IntroVideoButton } from "../marketing/IntroVideo";
import { trackCta, trackWhatsApp } from "../marketing/analytics";
import {
  ArrowLink,
  Eyebrow,
  Section,
  SectionHeader,
  Tag,
  TwoDoorBand,
  WhatsAppIcon,
  container,
  mbtn,
} from "../marketing/ui";

const BUILD = [
  {
    icon: Globe,
    title: "Websites",
    body: "Landing pages and booking sites that load fast on phones and slow networks, with WhatsApp built in.",
    to: "/portfolio?type=website",
  },
  {
    icon: Smartphone,
    title: "Mobile apps",
    body: "Android and iPhone apps built with Flutter, from the first design to the Play Store.",
    to: "/portfolio?type=mobile",
  },
  {
    icon: LayoutDashboard,
    title: "Business systems",
    body: "Dashboards and office systems for hotels and teams, including ones that keep working without internet.",
    to: "/portfolio?type=webapp",
  },
];

const TEACH = [
  {
    icon: MonitorPlay,
    title: "Live classes",
    body: "Every class is taught live, so you can ask questions as we build.",
  },
  {
    icon: Video,
    title: "Every class recorded",
    body: "Missed one or want to go over it again? The recording plays right in your dashboard.",
  },
  {
    icon: MessageSquare,
    title: "A mentor to ask",
    body: "Stuck on an error? Send a message and a screenshot, and get help.",
  },
  {
    icon: Wrench,
    title: "Real projects",
    body: "You build the same kind of things I build for businesses.",
  },
];

const TOOLS = [
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Firebase",
  "Flutter",
  "Dart",
  "SQLite",
  "Electron",
  "Figma",
];

const AboutPage: React.FC = () => {
  usePageMeta({
    title: "About Gideon",
    description:
      "Gideon Okanlawon is a developer and tutor in who builds websites, mobile apps and business systems, and teaches live coding cohorts.",
  });
  const { whatsapp } = useContactLinks();
  const { items } = usePortfolio();
  const featured = sortProjects(items)
    .filter((p) => p.featured)
    .slice(0, 3);

  return (
    <>
      <section
        className="bg-paper dark:bg-paper-dark"
        aria-labelledby="about-page-title"
      >
        <div
          className={`${container} grid items-center gap-10 pb-14 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:pb-20`}
        >
          <div className="space-y-6">
            <Eyebrow>About</Eyebrow>
            <h1
              id="about-page-title"
              className="font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
            >
              Hi, I&rsquo;m Gideon.
            </h1>
            <p className="max-w-[620px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
              I&rsquo;m a developer and tutor. I build websites, mobile apps and
              business systems, and I teach people to build them in live online
              classes.
            </p>
            <div className="space-y-4 text-base leading-[26px] text-slate-600 dark:text-slate-300">
              <p>
                I taught myself to code, first JavaScript, then React, Firebase
                and Flutter, by building things people actually use.
                That&rsquo;s still how I work: start from a real problem, design
                it, then build it properly.
              </p>
              <p>
                Today I build for businesses: booking websites, hotel and
                facility systems that keep running without internet, and mobile
                apps on the Play Store.
              </p>
              <p>
                In 2026 I started CodeWithGideon to teach the way I learned:
                live classes, real projects, and someone to ask when
                you&rsquo;re stuck.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("about")}
                className={mbtn({ kind: "primary", size: "lg" })}
              >
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </a>
              <Link
                to="/portfolio"
                onClick={() => trackCta("see_work", "about")}
                className={mbtn({ kind: "secondary", size: "lg" })}
              >
                See my work <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>
          <figure className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 to-teal-700 shadow-lift lg:rounded-[28px]">
            <SlotImage
              slot="about.portrait"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute right-4 top-4">
              <IntroVideoButton />
            </div>
            <figcaption className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 shadow-card">
              <span className="block font-display text-base font-semibold text-blue-900">
                Gideon Okanlawon
              </span>
              <span className="block text-sm font-medium text-slate-600">
                Developer and Tutor
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <Section tone="page" labelledBy="build-title">
        <SectionHeader
          id="build-title"
          eyebrow="What I build"
          tone="hire"
          title="For businesses that need it to work."
        />
        <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
          {BUILD.map(({ icon: Icon, title, body, to }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6 shadow-card transition hover:border-blue-900 dark:border-line-dark dark:bg-slate-900 dark:hover:border-slate-500"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950">
                <Icon
                  className="h-5 w-5 text-orange-700 dark:text-orange-300"
                  aria-hidden
                />
              </span>
              <h3 className="font-display text-xl font-semibold text-blue-900 dark:text-white">
                {title}
              </h3>
              <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                {body}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-900 dark:text-white">
                See examples{" "}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <p className="text-sm font-bold text-blue-900 dark:text-white">
            Tools I use
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="paper" labelledBy="teach-title">
        <SectionHeader
          id="teach-title"
          eyebrow="How I teach"
          tone="learn"
          title="Learn by building, live."
          action={
            <ArrowLink to="/courses" tone="learn">
              See the courses
            </ArrowLink>
          }
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {TEACH.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6 dark:border-line-dark dark:bg-slate-900"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950">
                <Icon
                  className="h-5 w-5 text-teal-700 dark:text-teal-300"
                  aria-hidden
                />
              </span>
              <h3 className="font-display text-lg font-semibold text-blue-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {featured.length ? (
        <Section tone="page" labelledBy="selected-title">
          <SectionHeader
            id="selected-title"
            eyebrow="Selected work"
            title="A few things I've built."
            action={<ArrowLink to="/portfolio">Full portfolio</ArrowLink>}
          />
          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} location="about" />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="paper" className="!py-10 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>
    </>
  );
};

export default AboutPage;
