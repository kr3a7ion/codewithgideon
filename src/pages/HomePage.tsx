import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Check, Download, FileText, MapPin, MessageSquare, PlayCircle, TrendingUp, Video } from "lucide-react";
import Courses from "../../components/Courses";
import { IMAGES } from "../../assets/images";
import { useApp } from "../app/AppContext";
import { usePageMeta } from "../app/usePageMeta";
import { HIRE_FAQ, HIRE_TERMS, JOIN_FAQ, LEARN_FAQ, PACKAGES, WORK } from "../marketing/content";
import { trackCta, trackWhatsApp } from "../marketing/analytics";
import { useContactLinks } from "../marketing/useContactLinks";
import {
  ArrowLink,
  CheckItem,
  DoorCard,
  Eyebrow,
  FaqList,
  HireCtaCard,
  PackageCard,
  Section,
  SectionHeader,
  StepCard,
  Tag,
  TwoDoorBand,
  WhatsAppIcon,
  WorkCard,
  container,
  mbtn,
} from "../marketing/ui";

const LEARN_STEPS = [
  { title: "Create your account", body: "Sign up with email or Google and choose the path you want to learn." },
  { title: "Pay for the weeks you want", body: "Pay by card, transfer or USSD through Paystack. Add more weeks any time." },
  { title: "Join live classes", body: "Classes run live with Gideon. Join from the app or your student dashboard." },
  { title: "Rewatch and ask", body: "Every class is recorded. Stuck? Ask your mentor or the student community." },
];

const APP_FEATURES = [
  { icon: Video, label: "Live classes" },
  { icon: PlayCircle, label: "Recordings" },
  { icon: FileText, label: "Resources" },
  { icon: MessageSquare, label: "Mentor chat" },
  { icon: CalendarDays, label: "Class schedule" },
  { icon: TrendingUp, label: "Weekly progress" },
];

const CLASSES_FAQ = [LEARN_FAQ[0], LEARN_FAQ[1], JOIN_FAQ[0], LEARN_FAQ[2]];
const WEBSITES_FAQ = [HIRE_FAQ[0], HIRE_FAQ[2], HIRE_FAQ[3], HIRE_FAQ[4]];

/** Illustrative student app screen for the "app" section (decorative). */
const PhoneMock: React.FC = () => (
  <div aria-hidden className="mx-auto w-[260px] rounded-[38px] bg-blue-950 p-2.5 shadow-lift ring-1 ring-white/10 sm:w-[280px]">
    <div className="flex flex-col gap-3 rounded-[30px] bg-white p-4 text-blue-900">
      <p className="mt-2 font-display text-lg font-semibold">Good evening, Amaka</p>
      <div className="rounded-2xl bg-teal-600 p-4 text-white">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-teal-100">Next live class</p>
        <p className="mt-1.5 font-display text-base font-semibold leading-6">Week 3 · Layouts that work on any phone</p>
        <p className="mt-1 text-sm font-medium text-teal-50">Tue · 7:00 pm</p>
        <p className="mt-3 rounded-xl bg-white py-2 text-center text-sm font-bold text-teal-700">Join class</p>
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">This week</p>
      {[
        { icon: PlayCircle, text: "Recording: Week 2 · Flexbox" },
        { icon: FileText, text: "Resource: Layout cheat sheet" },
        { icon: MessageSquare, text: "Mentor: Nice work! Try gap instead of margins." },
      ].map(({ icon: Icon, text }) => (
        <p key={text} className="flex items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13px] font-semibold leading-5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          {text}
        </p>
      ))}
    </div>
  </div>
);

/**
 * Home: one brand, two doors. The two-door hero leads, then the Learn block
 * (courses from Admin → Courses, how it works, the app), then the Hire block
 * (sample work, packages), then Gideon, FAQ and the two-door band.
 * Figma: "03 Home" in the rebrand file.
 */
const HomePage: React.FC = () => {
  const { navigateTo } = useApp();
  const { whatsapp, email, apk } = useContactLinks();
  usePageMeta({
    description:
      "Learn to code in live cohort classes with Gideon, or get a website that takes bookings for your business. Web, Flutter and AI-assisted development in Abuja, Nigeria.",
  });
  const [itura, adire] = WORK;

  return (
    <>
      {/* Hero: two equal doors */}
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="hero-title">
        <div className={`${container} grid items-center gap-10 pb-14 pt-9 sm:pt-14 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:gap-10 lg:pb-[88px] lg:pt-[72px]`}>
          <div className="flex flex-col gap-6 lg:gap-7">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-line-dark dark:bg-slate-900 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              Developer and teacher · Abuja
            </p>
            <h1
              id="hero-title"
              className="font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
            >
              Learn to <span className="text-teal-600 dark:text-teal-300">build it</span>,<br className="hidden sm:block" /> or{" "}
              <span className="text-orange-600 dark:text-orange-400">have it built.</span>
            </h1>
            <p className="max-w-[560px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
              Join a live cohort and learn to build for the web, or hire Gideon to build a website that takes bookings for your business.
            </p>
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-5">
              <DoorCard
                door="learn"
                title="Live cohort classes"
                body="Web, Flutter and AI-assisted development, live with Gideon. Recordings after every class. Pay weekly."
                cta="Join the next cohort"
                to="/courses"
                onClick={() => trackCta("join_cohort", "hero")}
              />
              <DoorCard
                door="hire"
                title="Websites for business"
                body="Booking sites and WhatsApp-first landing pages from ₦90,000, live in 5 to 14 days."
                cta="Get a website built"
                to="/hire"
                onClick={() => trackCta("get_website", "hero")}
              />
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {["A recording of every class", "Pay by the week", "Domain in your name"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Proof: the two demo builds */}
          <div className="relative mx-auto w-full max-w-[520px] lg:h-[540px]">
            <Link to={`/work/${itura.slug}`} className="block overflow-hidden rounded-[18px] shadow-lift sm:rounded-[20px]" aria-label={`${itura.name} case study`}>
              <img
                src={itura.images.cover}
                srcSet={`${itura.images.cover960} 960w, ${itura.images.cover} 1600w`}
                sizes="(min-width: 1024px) 520px, calc(100vw - 40px)"
                alt={itura.images.alt}
                width={1600}
                height={1000}
                {...{ fetchpriority: "high" }}
                className="aspect-[16/10] w-full object-cover"
              />
            </Link>
            <Link
              to={`/work/${adire.slug}`}
              className="absolute bottom-0 right-0 hidden w-[65%] overflow-hidden rounded-[20px] shadow-lift lg:block"
              aria-label={`${adire.name} case study`}
            >
              <img src={adire.images.cover960} alt={adire.images.alt} width={960} height={600} loading="lazy" className="aspect-[16/10] w-full object-cover" />
            </Link>
            <Link
              to="/work"
              onClick={() => trackCta("see_work", "hero")}
              className="mt-4 inline-flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-[15px] font-bold text-blue-900 shadow-card dark:bg-slate-900 dark:text-white lg:absolute lg:bottom-[120px] lg:left-0 lg:mt-0 lg:shadow-lift"
            >
              <Tag tone="sample">Sample projects</Tag>
              Try the live demos
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Learn: courses from Admin → Courses ("On home page" toggle) */}
      <Courses onNavigate={navigateTo} />

      {/* Learn: how a cohort works */}
      <Section id="how" tone="paper" labelledBy="how-title">
        <SectionHeader id="how-title" eyebrow="How it works" tone="learn" title="From sign-up to your first live class." description="Four steps, and you can start this week." />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEARN_STEPS.map((s, i) => (
            <StepCard key={s.title} n={i + 1} title={s.title} body={s.body} tone="learn" />
          ))}
        </ol>
      </Section>

      {/* Learn: the student app */}
      <Section tone="navy" labelledBy="app-title">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-20">
          <div>
            <Eyebrow onDark>The app</Eyebrow>
            <h2 id="app-title" className="mt-4 font-display text-[30px] font-bold leading-9 tracking-[-0.02em] sm:text-[40px] sm:leading-[46px]">
              Your classroom in your pocket.
            </h2>
            <p className="mt-5 max-w-[640px] text-base leading-[26px] text-blue-100 sm:text-lg sm:leading-7">
              Classes, recordings, resources, community and mentor chat, all in the CodeWithGideon app. On a laptop? The same things are in your student dashboard.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3.5">
              {APP_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold sm:px-3.5">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-teal-300" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {apk ? (
                <a href={apk} target="_blank" rel="noopener noreferrer" onClick={() => trackCta("download_app", "app")} className={mbtn({ kind: "learn", size: "lg" })}>
                  <Download className="h-5 w-5" aria-hidden /> Download the app
                </a>
              ) : null}
              <button type="button" onClick={() => navigateTo("student-login")} className={mbtn({ kind: "onDark", size: "lg" })}>
                Student login
              </button>
            </div>
            {apk ? <p className="mt-4 text-sm font-medium text-blue-200">Android app (APK).</p> : null}
          </div>
          <PhoneMock />
        </div>
      </Section>

      {/* Hire: sample work */}
      <Section tone="page" labelledBy="work-title">
        <SectionHeader
          id="work-title"
          eyebrow="Work"
          title="Real booking flows you can try."
          description="Two sample businesses, built end to end. Open a live demo and book a room or a hairstyle yourself."
          action={<ArrowLink to="/work">See all work</ArrowLink>}
        />
        <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {WORK.map((w) => (
            <WorkCard key={w.slug} work={w} location="work" />
          ))}
          <HireCtaCard location="work" />
        </div>
      </Section>

      {/* Hire: packages */}
      <Section tone="paper" labelledBy="biz-title">
        <SectionHeader
          id="biz-title"
          eyebrow="Hire"
          tone="hire"
          title="Websites for businesses that run on WhatsApp."
          description="Fixed prices and clear timelines. You see the design in Figma before anything is built."
          action={<ArrowLink to="/hire" tone="hire">How it works</ArrowLink>}
        />
        <div className="mt-10 grid items-start gap-4 sm:gap-6 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <PackageCard key={p.id} pkg={p} location="packages" />
          ))}
        </div>
        <ul className="mt-6 flex flex-col gap-2.5 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-medium text-blue-900 dark:border-line-dark dark:bg-slate-900 dark:text-white sm:flex-row sm:flex-wrap sm:gap-x-7">
          {HIRE_TERMS.map((t) => (
            <CheckItem key={t} tone="hire">
              {t}
            </CheckItem>
          ))}
        </ul>
      </Section>

      {/* Meet your teacher */}
      <Section id="about" tone="page" labelledBy="about-title">
        <div className="grid items-center gap-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-[72px]">
          <figure className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 to-teal-700 lg:rounded-[28px]">
            <img
              src={IMAGES.instructor.portrait}
              alt="Gideon Okanlawon"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover sm:aspect-[4/3] lg:aspect-[440/500]"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 shadow-card">
              <span className="block font-display text-base font-semibold text-blue-900">Gideon Okanlawon</span>
              <span className="block text-sm font-medium text-slate-600">Developer and frontend teacher</span>
            </figcaption>
          </figure>
          <div className="space-y-5">
            <Eyebrow tone="learn">Meet your teacher</Eyebrow>
            <h2 id="about-title" className="font-display text-[30px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[40px] sm:leading-[46px]">
              Hi, I&rsquo;m Gideon.
            </h2>
            <p className="max-w-[640px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
              I&rsquo;m a developer and frontend teacher in Abuja. I build websites and apps for a living, and I teach every cohort live, so you learn how real
              projects get made.
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {["Based in Abuja", "Frontend developer", "Teaches every cohort live"].map((f) => (
                <li key={f} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-blue-900 dark:border-line-dark dark:bg-paper-dark dark:text-white">
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp("about")} className={mbtn({ kind: "learn", size: "lg" })}>
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </a>
              <a href={`mailto:${email}`} className={mbtn({ kind: "secondary", size: "lg" })}>
                Email Gideon
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="paper" labelledBy="faq-title">
        <SectionHeader
          id="faq-title"
          eyebrow="FAQ"
          title="Questions, answered."
          description={
            <>
              Still stuck?{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-900 underline dark:text-white" onClick={() => trackWhatsApp("faq")}>
                Message Gideon on WhatsApp
              </a>{" "}
              and you&rsquo;ll get a real answer.
            </>
          }
        />
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-6">
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-blue-900 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden /> About the classes
            </h3>
            <FaqList items={CLASSES_FAQ} headingLevel="h4" />
          </div>
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-blue-900 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden /> About websites
            </h3>
            <FaqList items={WEBSITES_FAQ} headingLevel="h4" />
          </div>
        </div>
      </Section>

      <Section tone="page" className="!py-12 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>
    </>
  );
};

export default HomePage;
