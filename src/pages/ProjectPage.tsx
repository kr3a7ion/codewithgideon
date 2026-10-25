/* /portfolio/:slug — one project: the brief, what it does, screenshots, the
   tech, and what to do next (hire or learn). */
import React, { Suspense, lazy, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, Check, ChevronRight, Github, Play, Smartphone } from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { usePackages, usePortfolio } from "../marketing/useCatalog";
import { packagePrice, projectTypeLabel, type ProjectImage } from "../marketing/catalog";
import { ProjectCover, ProjectTags, projectHref, sortProjects } from "../marketing/portfolio";
import { trackCta, trackDemo } from "../marketing/analytics";
import { CheckItem, Section, Tag, TwoDoorBand, container, mbtn } from "../marketing/ui";
import { Dialog } from "../features/shared/Dialog";
import { LoadingPanel } from "../ui";

const NotFound = lazy(() => import("./NotFound"));

const h2 = "font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px] sm:leading-7";

const ProjectPage: React.FC = () => {
  const { slug } = useParams();
  const { items, ready } = usePortfolio();
  const { items: packages } = usePackages();
  const [viewing, setViewing] = useState<ProjectImage | null>(null);
  const project = items.find((p) => p.slug === slug);

  usePageMeta({
    title: project ? `${project.title}: ${project.kind || "Project"}` : "Project",
    description: project?.summary,
    image: project?.cover?.url?.startsWith("http") || project?.cover?.url?.startsWith("/") ? project?.cover?.url : undefined,
    noindex: ready && !project,
  });

  if (!project) {
    if (!ready) return <LoadingPanel />;
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }

  const list = sortProjects(items);
  const next = list[(list.findIndex((p) => p.id === project.id) + 1) % list.length];
  const pkg = packages.find((p) => p.id === project.packageId);
  const hireHref = `/hire?need=${pkg?.need || "other"}#enquire`;
  const links = [
    project.links.live && { href: project.links.live, label: "Visit the site", icon: ArrowUpRight, primary: true },
    project.links.playStore && { href: project.links.playStore, label: "Get it on Google Play", icon: Play, primary: !project.links.live },
    project.links.appStore && { href: project.links.appStore, label: "App Store", icon: Smartphone, primary: false },
    project.links.demo && { href: project.links.demo, label: "Try the live demo", icon: ArrowUpRight, primary: !project.links.live && !project.links.playStore },
    project.links.github && { href: project.links.github, label: "See the code", icon: Github, primary: false },
  ].filter(Boolean) as { href: string; label: string; icon: React.ComponentType<{ className?: string }>; primary: boolean }[];

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="pj-title">
        <div className={`${container} pb-10 pt-7 sm:pb-[72px] sm:pt-12`}>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/portfolio" className="hover:text-blue-900 hover:underline dark:hover:text-white">
                  Portfolio
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-blue-900 dark:text-white">
                {project.title}
              </li>
            </ol>
          </nav>
          <ProjectTags project={project} className="mt-5" />
          <h1
            id="pj-title"
            className="mt-4 font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
          >
            {project.title}
          </h1>
          <p className="mt-4 max-w-[680px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{project.summary}</p>
          {links.length ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackDemo(project.slug, "case_study")}
                  className={mbtn({ kind: l.primary ? "primary" : "secondary", size: "lg" })}
                >
                  {l.label} <l.icon className="h-5 w-5" aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </div>
          ) : null}
          <div className="mt-8 aspect-[16/10] overflow-hidden rounded-[18px] shadow-lift sm:mt-10 sm:rounded-[28px]">
            <ProjectCover project={project} eager sizes="(min-width: 1248px) 1200px, calc(100vw - 40px)" />
          </div>
        </div>
      </section>

      <Section tone="page">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div className="space-y-12 sm:space-y-14">
            {project.brief ? (
              <section aria-labelledby="pj-brief">
                <h2 id="pj-brief" className={h2}>The brief</h2>
                <p className="mt-4 text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{project.brief}</p>
              </section>
            ) : null}

            {project.features.length ? (
              <section aria-labelledby="pj-features">
                <h2 id="pj-features" className={h2}>What it does</h2>
                <ul className="mt-4 space-y-3 text-base leading-[26px] text-slate-600 dark:text-slate-300">
                  {project.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
                        <Check className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.gallery.length ? (
              <section aria-labelledby="pj-gallery">
                <h2 id="pj-gallery" className={h2}>Screens</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5">
                  {project.gallery.map((g, i) => (
                    <li key={`${g.url}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setViewing(g)}
                        className="group block w-full overflow-hidden rounded-xl border border-line bg-paper text-left dark:border-line-dark dark:bg-paper-dark"
                      >
                        <img
                          src={g.smUrl || g.url}
                          alt={g.alt || g.caption || `${project.title} screen ${i + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[420px] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </button>
                      {g.caption ? <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{g.caption}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.tech.length ? (
              <section aria-labelledby="pj-tech">
                <h2 id="pj-tech" className={h2}>Built with</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <li key={t}>
                      <Tag>{t}</Tag>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="About this project">
            <dl className="divide-y divide-line rounded-[20px] border border-line bg-white px-6 dark:divide-line-dark dark:border-line-dark dark:bg-slate-900">
              {[
                ["My role", project.role],
                ["Type", project.types.map(projectTypeLabel).join(", ")],
                ["Year", project.year],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-4 text-sm">
                    <dt className="font-medium text-slate-500 dark:text-slate-400">{k}</dt>
                    <dd className="text-right font-bold text-blue-900 dark:text-white">{v}</dd>
                  </div>
                ))}
            </dl>

            {pkg ? (
              <div className="flex flex-col gap-4 rounded-[20px] border-2 border-orange-500 bg-white p-7 shadow-lift dark:bg-slate-900">
                <Tag tone="hire" className="w-fit">Want one like this?</Tag>
                <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{pkg.name}</h2>
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-[30px] font-bold leading-none tracking-[-0.02em] text-blue-900 dark:text-white">{packagePrice(pkg)}</span>
                  {pkg.priceMode !== "quote" && pkg.priceNote ? <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{pkg.priceNote}</span> : null}
                </p>
                {pkg.timeline ? (
                  <p className="flex items-center gap-2 text-[15px] font-bold text-blue-900 dark:text-white">
                    <Calendar className="h-[18px] w-[18px] text-slate-500" aria-hidden />
                    {pkg.timeline}
                  </p>
                ) : null}
                <ul className="space-y-2.5 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                  {pkg.includes.slice(0, 4).map((i) => (
                    <CheckItem key={i} tone="hire">
                      {i}
                    </CheckItem>
                  ))}
                </ul>
                <Link to={hireHref} onClick={() => trackCta("get_one", "case_study")} className={mbtn({ kind: "hire", full: true })}>
                  {pkg.cta || "Get one for your business"} <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <Link to="/hire#packages" className={mbtn({ kind: "secondary", full: true })}>
                  See all packages
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-[20px] bg-orange-50 p-6 dark:bg-orange-950/40">
                <Tag tone="hire">Hire</Tag>
                <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Need something like this?</h2>
                <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">Tell me what you need. You get a plan and a price before anything is built.</p>
                <Link to="/hire#enquire" onClick={() => trackCta("get_one", "case_study")} className={mbtn({ kind: "hire", full: true })}>
                  Start a project <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </div>
            )}

            {project.learnHref ? (
              <div className="flex flex-col items-start gap-3 rounded-[20px] bg-teal-50 p-6 dark:bg-teal-950/60">
                <Tag tone="learn">Learn</Tag>
                <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Learn to build this</h2>
                <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">Join a live cohort and build projects like this one with Gideon.</p>
                <Link to={project.learnHref} onClick={() => trackCta("learn_to_build", "case_study")} className={mbtn({ kind: "learn", full: true })}>
                  See the course <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </div>
            ) : null}
          </aside>
        </div>

        {next && next.id !== project.id ? (
          <Link
            to={projectHref(next)}
            className="group mt-14 flex items-center gap-4 rounded-[20px] bg-paper p-3 pr-5 transition-colors hover:bg-[#DFE7F0] dark:bg-paper-dark dark:hover:bg-slate-800 sm:mt-20 sm:gap-7 sm:p-4 sm:pr-7"
          >
            <span className="block aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xl sm:w-60">
              <ProjectCover project={next} />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Next project</span>
              <span className="mt-1 block font-display text-lg font-semibold text-blue-900 dark:text-white sm:text-[22px]">{next.title}</span>
              <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">{next.kind}</span>
            </span>
            <ArrowRight className="h-6 w-6 shrink-0 text-blue-900 transition-transform group-hover:translate-x-1 dark:text-white" aria-hidden />
          </Link>
        ) : null}
      </Section>

      <Section tone="paper" className="!py-10 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={viewing?.caption || project.title} size="lg">
        {viewing ? <img src={viewing.url} alt={viewing.alt || ""} className="max-h-[75vh] w-full rounded-xl object-contain" /> : null}
      </Dialog>
    </>
  );
};

export default ProjectPage;
