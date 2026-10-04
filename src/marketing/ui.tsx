/**
 * Building blocks for the public Learn · Work · Hire pages.
 * Mirrors the "02 Components" page of the Figma rebrand file.
 */
import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, Check, Minus, PenTool, Plus } from "lucide-react";
import { cn } from "../ui";
import type { Faq, Package, WorkEntry } from "./content";
import { demoUrl } from "./content";
import { trackCta, trackDemo, type CtaLocation } from "./analytics";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** 1200px content column with 20px gutters on phones. */
export const container = "mx-auto w-full max-w-[1248px] px-5 sm:px-6";

export const Section: React.FC<{
  id?: string;
  tone?: "page" | "paper" | "navy";
  className?: string;
  children: React.ReactNode;
  labelledBy?: string;
}> = ({ id, tone = "page", className, children, labelledBy }) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={cn(
      "scroll-mt-20 py-14 sm:py-20 lg:py-24",
      tone === "paper" && "bg-paper dark:bg-paper-dark",
      tone === "page" && "bg-white dark:bg-slate-950",
      tone === "navy" && "bg-blue-900 text-white dark:bg-blue-950",
      className,
    )}
  >
    <div className={container}>{children}</div>
  </section>
);

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

// The official logo lives in ./logo.tsx; re-exported so pages import one place.
export { BrandMark, Lockup } from "./logo";

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045c0 2.12.554 4.188 1.597 6.004L0 24l6.135-1.61a11.822 11.822 0 005.912 1.569h.005c6.634 0 12.043-5.411 12.046-12.047a11.817 11.817 0 00-3.535-8.414z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export type Kind = "primary" | "learn" | "hire" | "secondary" | "ghost" | "onDark";

const kinds: Record<Kind, string> = {
  primary: "bg-blue-900 text-white hover:bg-blue-800 dark:bg-white dark:text-blue-900 dark:hover:bg-blue-50",
  learn: "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-400 dark:text-blue-950 dark:hover:bg-teal-300",
  hire: "bg-orange-500 text-blue-950 hover:bg-orange-400",
  secondary:
    "border-[1.5px] border-line-strong bg-white text-blue-900 hover:border-blue-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-slate-400",
  ghost: "text-blue-900 hover:bg-blue-900/5 dark:text-white dark:hover:bg-white/10",
  onDark: "border-[1.5px] border-white/30 bg-white/5 text-white hover:bg-white/10",
};

/** Classes for a link or button in the rebrand style. */
export const mbtn = ({
  kind = "primary",
  size = "md",
  full = false,
  tight = false,
  className,
}: { kind?: Kind; size?: "sm" | "md" | "lg"; full?: boolean; tight?: boolean; className?: string } = {}) =>
  cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60",
    size === "lg" ? "h-14 rounded-[14px] text-base" : size === "sm" ? "h-11 rounded-xl text-[15px]" : "h-12 rounded-xl text-[15px]",
    kind === "ghost" ? "px-2" : tight ? "px-3" : size === "lg" ? "px-6" : size === "sm" ? "px-4" : "px-5",
    kinds[kind],
    full && "w-full",
    className,
  );

/** Internal link that reads like a text link with an arrow. */
export const ArrowLink: React.FC<{ to: string; children: React.ReactNode; tone?: "brand" | "learn" | "hire"; className?: string; onClick?: () => void }> = ({
  to,
  children,
  tone = "brand",
  className,
  onClick,
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "group inline-flex items-center gap-1.5 text-[15px] font-bold hover:underline",
      tone === "learn" ? "text-teal-700 dark:text-teal-300" : tone === "hire" ? "text-orange-700 dark:text-orange-300" : "text-blue-900 dark:text-white",
      className,
    )}
  >
    {children}
    <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden />
  </Link>
);

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export type Tone = "learn" | "hire" | "brand";

const dot: Record<Tone, string> = {
  learn: "bg-teal-500",
  hire: "bg-orange-500",
  brand: "bg-blue-900 dark:bg-white",
};

export const Eyebrow: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string; onDark?: boolean }> = ({ tone = "brand", children, className, onDark }) => (
  <p className={cn("flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em]", onDark ? "text-slate-300" : "text-slate-500 dark:text-slate-400", className)}>
    <span className={cn("h-2 w-2 rounded-full", onDark ? "bg-white" : dot[tone])} aria-hidden />
    {children}
  </p>
);

export const Tag: React.FC<{ tone?: "learn" | "hire" | "sample" | "neutral"; children: React.ReactNode; className?: string }> = ({ tone = "neutral", children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-4",
      tone === "learn" && "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
      tone === "hire" && "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      tone === "sample" && "border border-dashed border-line-strong bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
      tone === "neutral" && "bg-paper text-blue-900 dark:bg-slate-800 dark:text-slate-100",
      className,
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        tone === "learn" && "bg-teal-500",
        tone === "hire" && "bg-orange-500",
        tone === "sample" && "bg-slate-400",
        tone === "neutral" && "bg-blue-900 dark:bg-slate-300",
      )}
      aria-hidden
    />
    {children}
  </span>
);

export const SectionHeader: React.FC<{
  id?: string;
  eyebrow: string;
  tone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}> = ({ id, eyebrow, tone = "brand", title, description, action, as = "h2", className }) => {
  const H = as;
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-[720px]">
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <H
          id={id}
          className={cn(
            "mt-3 font-display font-bold tracking-[-0.02em] text-blue-900 dark:text-white",
            as === "h1" ? "text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]" : "text-[30px] leading-9 sm:text-[40px] sm:leading-[46px]",
          )}
        >
          {title}
        </H>
        {description ? <p className="mt-3 text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-x-7 gap-y-3">{action}</div> : null}
    </div>
  );
};

export const CheckItem: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = "brand", children, className }) => (
  <li className={cn("flex gap-2.5", className)}>
    <Check
      className={cn(
        "mt-[3px] h-[18px] w-[18px] shrink-0",
        tone === "learn" ? "text-teal-600 dark:text-teal-300" : tone === "hire" ? "text-orange-700 dark:text-orange-300" : "text-blue-900 dark:text-white",
      )}
      aria-hidden
    />
    <span>{children}</span>
  </li>
);

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

const cardBase = "rounded-[20px] border border-line bg-white shadow-card dark:border-line-dark dark:bg-slate-900";

export const DoorCard: React.FC<{
  door: "learn" | "hire";
  title: string;
  body: string;
  cta: string;
  to: string;
  onClick?: () => void;
}> = ({ door, title, body, cta, to, onClick }) => (
  <div className={cn(cardBase, "flex flex-col justify-between gap-5 p-6")}>
    <div className="space-y-3.5">
      <Tag tone={door}>{door === "learn" ? "Learn" : "Hire"}</Tag>
      <h2 className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">{title}</h2>
      <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</p>
    </div>
    <Link to={to} onClick={onClick} className={mbtn({ kind: door, size: "lg", full: true })}>
      {cta}
      <ArrowRight className="h-5 w-5" aria-hidden />
    </Link>
  </div>
);

export const DemoLink: React.FC<{ work: WorkEntry; location: CtaLocation; className?: string; children?: React.ReactNode }> = ({ work, location, className, children }) => (
  <a
    href={demoUrl(work)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => trackDemo(work.slug, location)}
    className={className}
  >
    {children ?? (
      <>
        Live demo <ArrowUpRight className="h-4 w-4" aria-hidden />
        <span className="sr-only"> of {work.name}</span>
      </>
    )}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

export const WorkCard: React.FC<{ work: WorkEntry; location?: CtaLocation; headingLevel?: "h2" | "h3" }> = ({ work, location = "work", headingLevel = "h3" }) => {
  const H = headingLevel;
  const href = `/work/${work.slug}`;
  return (
    <article className={cn(cardBase, "group flex flex-col overflow-hidden")}>
      <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[16/10] overflow-hidden bg-paper dark:bg-paper-dark">
        <img
          src={work.images.card}
          alt=""
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-6 pb-5 pt-5">
        <div className="flex flex-wrap gap-2">
          <Tag>{work.type}</Tag>
          <Tag tone="sample">Sample project</Tag>
        </div>
        <H className="font-display text-[22px] font-semibold leading-7 tracking-[-0.01em] text-blue-900 dark:text-white">
          <Link to={href} className="hover:underline">
            {work.name}
          </Link>
        </H>
        <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{work.result}</p>
        <div className="mt-1 flex items-center justify-between border-t border-line pt-4 text-sm font-bold text-blue-900 dark:border-line-dark dark:text-white">
          <DemoLink work={work} location={location} className="inline-flex items-center gap-1.5 hover:underline" />
          <Link to={href} className="inline-flex items-center gap-1.5 hover:underline">
            Case study <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">: {work.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export const HireCtaCard: React.FC<{ location?: CtaLocation }> = ({ location = "work" }) => (
  <div className="flex flex-col items-start gap-3.5 rounded-[20px] border-[1.5px] border-dashed border-orange-400 bg-orange-50 p-7 dark:border-orange-500/60 dark:bg-orange-950/40">
    <span className="rounded-[14px] bg-white p-3 dark:bg-slate-900">
      <PenTool className="h-6 w-6 text-orange-700 dark:text-orange-300" aria-hidden />
    </span>
    <Tag tone="hire">Hire</Tag>
    <h3 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">Your business could be next.</h3>
    <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
      Tell me what you sell and how customers book. I&rsquo;ll design it in Figma first so you see it before I build it.
    </p>
    <Link to="/hire" onClick={() => trackCta("get_website", location)} className={mbtn({ kind: "hire", className: "mt-1" })}>
      Get a website built <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
    </Link>
  </div>
);

export const PackageCard: React.FC<{ pkg: Package; location?: CtaLocation; headingLevel?: "h2" | "h3" }> = ({ pkg, location = "packages", headingLevel = "h3" }) => {
  const H = headingLevel;
  const to = pkg.id === "care" ? "/hire?need=other#enquire" : `/hire?need=${pkg.id}#enquire`;
  return (
    <div
      className={cn(
        "flex flex-col gap-[18px] rounded-[20px] bg-white p-7 dark:bg-slate-900",
        pkg.featured ? "border-2 border-orange-500 shadow-lift" : "border border-line shadow-card dark:border-line-dark",
      )}
    >
      <div className="space-y-2">
        {pkg.badge ? <Tag tone="hire">{pkg.badge}</Tag> : null}
        <H className="font-display text-[22px] font-semibold leading-7 tracking-[-0.01em] text-blue-900 dark:text-white">{pkg.name}</H>
        <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{pkg.description}</p>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] text-blue-900 dark:text-white">{pkg.price}</span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{pkg.priceNote}</span>
      </p>
      <p className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-white">
        <Calendar className="h-[18px] w-[18px] text-slate-500" aria-hidden />
        <span>
          <span className="sr-only">Timeline: </span>
          {pkg.timeline}
        </span>
      </p>
      <ul className="space-y-2.5 border-t border-line pt-[18px] text-sm font-medium leading-[22px] text-slate-600 dark:border-line-dark dark:text-slate-300">
        {pkg.includes.map((i) => (
          <CheckItem key={i} tone="hire">
            {i}
          </CheckItem>
        ))}
      </ul>
      <Link
        to={to}
        onClick={() => trackCta(`package_${pkg.id}`, location)}
        className={mbtn({ kind: pkg.featured ? "hire" : "secondary", full: true, className: "mt-auto" })}
      >
        {pkg.cta} <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
        <span className="sr-only">: {pkg.name}</span>
      </Link>
    </div>
  );
};

const stepTone = {
  hire: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  learn: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  neutral: "bg-paper text-blue-900 dark:bg-slate-800 dark:text-white",
};

export const StepCard: React.FC<{ n: number; title: string; body: string; tone?: keyof typeof stepTone }> = ({ n, title, body, tone = "hire" }) => (
  <li className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6 dark:border-line-dark dark:bg-slate-900">
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl font-display text-base font-bold",
        stepTone[tone],
      )}
      aria-hidden
    >
      {n}
    </span>
    <h3 className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
      <span className="sr-only">Step {n}: </span>
      {title}
    </h3>
    <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</p>
  </li>
);

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const FaqList: React.FC<{ items: Faq[]; defaultOpen?: number; headingLevel?: "h3" | "h4" }> = ({ items, defaultOpen = 0, headingLevel = "h3" }) => {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  const Q = headingLevel;
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${base}-q${i}`;
        const panelId = `${base}-a${i}`;
        return (
          <div key={item.q} className="rounded-2xl border border-line bg-white dark:border-line-dark dark:bg-slate-900">
            <Q>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left font-display text-base font-semibold leading-6 text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-white sm:px-6"
              >
                {item.q}
                {isOpen ? <Minus className="h-5 w-5 shrink-0" aria-hidden /> : <Plus className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />}
              </button>
            </Q>
            <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen} className="px-5 pb-5 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300 sm:px-6">
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Two doors band
// ---------------------------------------------------------------------------

export const TwoDoorBand: React.FC<{ location?: CtaLocation; learnTitle?: string; learnBody?: string }> = ({
  location = "band",
  learnTitle = "Want to build sites like these?",
  learnBody = "In the web development cohort you learn to build business websites like these, live with Gideon.",
}) => (
  <div className="grid gap-4 md:grid-cols-2 md:gap-6">
    <div className="flex flex-col items-start gap-3 rounded-3xl bg-teal-50 p-6 dark:bg-teal-950/60 sm:p-8">
      <Tag tone="learn">Learn</Tag>
      <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{learnTitle}</h2>
      <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300">{learnBody}</p>
      <Link to="/courses" onClick={() => trackCta("see_courses", location)} className={mbtn({ kind: "learn", className: "mt-1 w-full sm:w-auto" })}>
        See the courses <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
      </Link>
    </div>
    <div className="flex flex-col items-start gap-3 rounded-3xl bg-orange-50 p-6 dark:bg-orange-950/40 sm:p-8">
      <Tag tone="hire">Hire</Tag>
      <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">Want one for your business?</h2>
      <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300">Fixed prices from ₦90,000. The domain and hosting stay in your name.</p>
      <Link to="/hire" onClick={() => trackCta("get_website", location)} className={mbtn({ kind: "hire", className: "mt-1 w-full sm:w-auto" })}>
        Get a website built <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
      </Link>
    </div>
  </div>
);
