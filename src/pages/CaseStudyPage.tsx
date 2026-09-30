import React, { Suspense, lazy } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, Check, ChevronRight } from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { WORK, findWork } from "../marketing/content";
import { trackCta } from "../marketing/analytics";
import { CheckItem, DemoLink, Section, StepCard, Tag, TwoDoorBand, container, mbtn } from "../marketing/ui";

const NotFound = lazy(() => import("./NotFound"));

/** /work/:slug — case study template (brief §4). */
const CaseStudyPage: React.FC = () => {
  const { slug } = useParams();
  const work = findWork(slug);

  usePageMeta({
    title: work ? `${work.name}: ${work.type}` : "Project not found",
    description: work ? `${work.result} A sample project by Gideon, with a live demo you can try.` : undefined,
    image: work?.images.og,
    noindex: !work,
  });

  if (!work) {
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }

  const next = WORK[(WORK.indexOf(work) + 1) % WORK.length];
  const hireHref = `/hire?need=${work.pkg.need}#enquire`;

  return (
    <>
      {/* Hero */}
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="cs-title">
        <div className={`${container} pb-10 pt-7 sm:pb-[72px] sm:pt-12`}>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/work" className="hover:text-blue-900 hover:underline dark:hover:text-white">
                  Work
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-blue-900 dark:text-white">
                {work.name}
              </li>
            </ol>
          </nav>
          <div className="mt-5 flex flex-wrap gap-2">
            <Tag>{work.type}</Tag>
            <Tag tone="sample">Sample project</Tag>
          </div>
          <h1
            id="cs-title"
            className="mt-4 font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
          >
            {work.name}
          </h1>
          <p className="mt-4 max-w-[640px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{work.result}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <DemoLink work={work} location="case_study" className={mbtn({ kind: "primary", size: "lg" })}>
              View live demo <ArrowUpRight className="h-5 w-5" aria-hidden />
            </DemoLink>
            <Link to={hireHref} onClick={() => trackCta("get_one", "case_study")} className={mbtn({ kind: "hire", size: "lg" })}>
              Get one for your business <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              to={work.learn.href}
              onClick={() => trackCta("learn_to_build", "case_study")}
              className={mbtn({ kind: "ghost", size: "lg", className: "justify-start !text-teal-700 dark:!text-teal-300 sm:justify-center" })}
            >
              Learn to build this <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-[18px] shadow-lift sm:mt-10 sm:rounded-[28px]">
            <img
              src={work.images.cover}
              srcSet={`${work.images.cover960} 960w, ${work.images.cover} 1600w`}
              sizes="(min-width: 1248px) 1200px, calc(100vw - 40px)"
              alt={work.images.alt}
              width={1600}
              height={1000}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <Section tone="page">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div className="space-y-12 sm:space-y-14">
            <section aria-labelledby="cs-brief">
              <h2 id="cs-brief" className="font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
                The brief
              </h2>
              <p className="mt-4 text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{work.brief}</p>
            </section>

            <section aria-labelledby="cs-features">
              <h2 id="cs-features" className="font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
                What it does
              </h2>
              <ul className="mt-4 space-y-3 text-base leading-[26px] text-slate-600 dark:text-slate-300">
                {work.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
                      <Check className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="cs-steps">
              <h2 id="cs-steps" className="font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
                {work.stepsTitle}
              </h2>
              <ol className="mt-4 grid gap-4 md:grid-cols-3">
                {work.steps.map((s, i) => (
                  <StepCard key={s.title} n={i + 1} title={s.title} body={s.body} tone="neutral" />
                ))}
              </ol>
            </section>

            <section aria-labelledby="cs-screens">
              <h2 id="cs-screens" className="font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
                On a laptop and a phone
              </h2>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_26%] items-start gap-3 sm:gap-5">
                <img
                  src={work.images.desktop}
                  alt={`${work.name} home page on a laptop`}
                  width={1440}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-xl border border-line dark:border-line-dark"
                />
                <img
                  src={work.images.mobile}
                  alt={`${work.name} home page on a phone`}
                  width={780}
                  height={1688}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-xl border border-line dark:border-line-dark"
                />
              </div>
            </section>

            <section aria-labelledby="cs-built">
              <h2 id="cs-built" className="font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
                Built with
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {work.builtWith.map((b) => (
                  <li key={b}>
                    <Tag>{b}</Tag>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* What you'd get */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="What you'd get">
            <div className="flex flex-col gap-4 rounded-[20px] border-2 border-orange-500 bg-white p-7 shadow-lift dark:bg-slate-900">
              <Tag tone="hire" className="w-fit">
                What you&rsquo;d get
              </Tag>
              <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{work.pkg.name}</h2>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] text-blue-900 dark:text-white">{work.pkg.price}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">one-off</span>
              </p>
              <p className="flex items-center gap-2 text-[15px] font-bold text-blue-900 dark:text-white">
                <Calendar className="h-[18px] w-[18px] text-slate-500" aria-hidden />
                <span>
                  <span className="sr-only">Timeline: </span>
                  {work.pkg.timeline}
                </span>
              </p>
              <ul className="space-y-2.5 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                {work.pkg.includes.map((i) => (
                  <CheckItem key={i} tone="hire">
                    {i}
                  </CheckItem>
                ))}
              </ul>
              {work.pkg.note ? <p className="rounded-xl bg-paper px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{work.pkg.note}</p> : null}
              <Link to={hireHref} onClick={() => trackCta("get_one", "case_study")} className={mbtn({ kind: "hire", full: true })}>
                Get one for your business <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
              </Link>
              <Link to="/hire#packages" className={mbtn({ kind: "secondary", full: true })}>
                See all packages
              </Link>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">60% to start, 40% before go-live.</p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-[20px] bg-teal-50 p-6 dark:bg-teal-950/60">
              <Tag tone="learn">Learn</Tag>
              <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Learn to build this</h2>
              <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                The {work.learn.label.toLowerCase()} teaches the stack behind this site, live with Gideon.
              </p>
              <Link to={work.learn.href} onClick={() => trackCta("learn_to_build", "case_study")} className={mbtn({ kind: "learn", full: true })}>
                See the web cohort <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>

        {/* Next project */}
        <Link
          to={`/work/${next.slug}`}
          className="group mt-14 flex items-center gap-4 rounded-[20px] bg-paper p-3 pr-5 transition-colors hover:bg-[#F1ECE3] dark:bg-paper-dark dark:hover:bg-slate-800 sm:mt-20 sm:gap-7 sm:p-4 sm:pr-7"
        >
          <img src={next.images.card} alt="" width={800} height={500} loading="lazy" className="aspect-[16/10] w-28 shrink-0 rounded-xl object-cover sm:w-60" />
          <span className="flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Next project</span>
            <span className="mt-1 block font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px]">{next.name}</span>
            <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">{next.type}</span>
          </span>
          <ArrowRight className="h-6 w-6 shrink-0 text-blue-900 transition-transform group-hover:translate-x-1 dark:text-white" aria-hidden />
        </Link>
      </Section>

      <Section tone="paper" className="!py-10 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>
    </>
  );
};

export default CaseStudyPage;
