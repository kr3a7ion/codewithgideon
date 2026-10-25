/* /portfolio — everything Gideon has built: own products, client work and demos. */
import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { usePortfolio } from "../marketing/useCatalog";
import { PORTFOLIO_FILTERS, ProjectCard, sortProjects } from "../marketing/portfolio";
import { Eyebrow, HireCtaCard, Section, TwoDoorBand, container } from "../marketing/ui";
import { cn } from "../ui";

const PortfolioPage: React.FC = () => {
  usePageMeta({
    title: "Portfolio",
    description: "Websites, mobile apps and business systems built by Gideon: his own products, client work and live demos you can try.",
  });
  const { items } = usePortfolio();
  const [params, setParams] = useSearchParams();
  const filter = params.get("type") || "all";
  const all = useMemo(() => sortProjects(items), [items]);
  const filters = PORTFOLIO_FILTERS.filter((f) => f.value === "all" || all.some(f.match));
  const active = filters.find((f) => f.value === filter) || filters[0];
  const shown = all.filter(active.match);

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="portfolio-title">
        <div className={`${container} pb-9 pt-10 sm:pb-14 sm:pt-20`}>
          <Eyebrow>Portfolio</Eyebrow>
          <h1
            id="portfolio-title"
            className="mt-4 max-w-[820px] font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
          >
            Things I&rsquo;ve built.
          </h1>
          <p className="mt-5 max-w-[660px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
            Websites, mobile apps and systems that run real businesses: my own products, work for clients, and demos you can click through.
          </p>
          <div role="tablist" aria-label="Filter projects" className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {filters.map((f) => {
              const on = f.value === active.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setParams(f.value === "all" ? {} : { type: f.value }, { replace: true })}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
                    on
                      ? "bg-blue-900 text-white dark:bg-white dark:text-blue-900"
                      : "bg-white text-blue-900 ring-1 ring-line hover:ring-blue-900 dark:bg-slate-900 dark:text-white dark:ring-line-dark",
                  )}
                >
                  {f.label}
                  <span className={cn("ml-1.5 text-xs", on ? "opacity-80" : "text-slate-500")}>{all.filter(f.match).length}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Section tone="page" className="!pt-9 sm:!pt-14">
        <h2 className="sr-only">{active.label}</h2>
        {shown.length ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {active.value === "all" || active.value === "website" ? <HireCtaCard location="portfolio" /> : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
            <Briefcase className="h-8 w-8" aria-hidden />
            Nothing here yet.
          </div>
        )}
      </Section>

      <Section tone="paper" className="!py-10 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>
    </>
  );
};

export default PortfolioPage;
