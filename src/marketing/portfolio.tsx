/* Portfolio pieces for the public pages: project cards, covers, tags, links. */
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Code2, Monitor, Smartphone, Globe, LayoutDashboard } from "lucide-react";
import { cn } from "../ui";
import { OWNERSHIP_LABEL, STATUS_LABEL, type Project, type ProjectType } from "./catalog";
import { trackDemo, type CtaLocation } from "./analytics";
import { Tag } from "./ui";

export const projectHref = (p: Pick<Project, "slug">) => `/portfolio/${p.slug}`;

export const TYPE_ICON: Record<ProjectType, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  mobile: Smartphone,
  webapp: LayoutDashboard,
  desktop: Monitor,
};

/** Filters on the Portfolio page. */
export const PORTFOLIO_FILTERS: { value: string; label: string; match: (p: Project) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "website", label: "Websites", match: (p) => p.types.includes("website") },
  { value: "mobile", label: "Mobile apps", match: (p) => p.types.includes("mobile") },
  { value: "webapp", label: "Web apps & platforms", match: (p) => p.types.includes("webapp") },
  { value: "desktop", label: "Office systems", match: (p) => p.types.includes("desktop") },
  { value: "demo", label: "Demos", match: (p) => p.ownership === "demo" },
];

/** Featured first, then the admin's order. */
export const sortProjects = (list: Project[]) =>
  [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);

/** Cover picture, or a branded placeholder until Gideon adds one. */
export const ProjectCover: React.FC<{ project: Project; className?: string; eager?: boolean; sizes?: string }> = ({ project, className, eager, sizes }) => {
  const c = project.cover;
  if (c?.url) {
    return (
      <img
        src={c.url}
        srcSet={c.smUrl && c.smUrl !== c.url ? `${c.smUrl} 960w, ${c.url} 1600w` : undefined}
        sizes={sizes || "(min-width: 1024px) 400px, calc(100vw - 40px)"}
        alt={c.alt || ""}
        loading={eager ? undefined : "lazy"}
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  const Icon = TYPE_ICON[project.types[0] || "website"] || Code2;
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700",
        className,
      )}
      aria-hidden
    >
      <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <span className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-teal-400/20" />
      <span className="relative flex flex-col items-center gap-2 text-white">
        <Icon className="h-9 w-9 opacity-90" />
        <span className="px-4 text-center font-display text-xl font-bold tracking-tight">{project.title}</span>
      </span>
    </div>
  );
};

export const ProjectTags: React.FC<{ project: Project; className?: string }> = ({ project, className }) => (
  <div className={cn("flex flex-wrap gap-2", className)}>
    {project.kind ? <Tag>{project.kind}</Tag> : null}
    {project.ownership === "demo" ? (
      <Tag tone="sample">{OWNERSHIP_LABEL.demo}</Tag>
    ) : project.ownership === "client" ? (
      <Tag tone="hire">{OWNERSHIP_LABEL.client}</Tag>
    ) : (
      <Tag tone="learn">{OWNERSHIP_LABEL.own}</Tag>
    )}
    {project.status === "building" ? <Tag tone="sample">{STATUS_LABEL.building}</Tag> : null}
  </div>
);

/** The first useful outside link for a card: live site, store, then demo. */
export const primaryLink = (p: Project): { href: string; label: string } | null => {
  if (p.links.live) return { href: p.links.live, label: "Visit site" };
  if (p.links.playStore) return { href: p.links.playStore, label: "Google Play" };
  if (p.links.appStore) return { href: p.links.appStore, label: "App Store" };
  if (p.links.demo) return { href: p.links.demo, label: "Live demo" };
  return null;
};

export const ProjectCard: React.FC<{ project: Project; location?: CtaLocation; headingLevel?: "h2" | "h3" }> = ({
  project: p,
  location = "portfolio",
  headingLevel = "h3",
}) => {
  const H = headingLevel;
  const href = projectHref(p);
  const out = primaryLink(p);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-card dark:border-line-dark dark:bg-slate-900">
      <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[16/10] overflow-hidden bg-paper dark:bg-paper-dark">
        <ProjectCover project={p} className="transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-6 pb-5 pt-5">
        <ProjectTags project={p} />
        <H className="font-display text-[22px] font-semibold leading-7 tracking-[-0.01em] text-blue-900 dark:text-white">
          <Link to={href} className="hover:underline">
            {p.title}
          </Link>
        </H>
        <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{p.summary}</p>
        <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm font-bold text-blue-900 dark:border-line-dark dark:text-white">
          {out ? (
            <a
              href={out.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackDemo(p.slug, location)}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              {out.label} <ArrowUpRight className="h-4 w-4" aria-hidden />
              <span className="sr-only"> for {p.title} (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{p.role}</span>
          )}
          <Link to={href} className="inline-flex shrink-0 items-center gap-1.5 hover:underline">
            Case study <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">: {p.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

/**
 * "See what you could build" on the course pages: projects made with what a
 * course teaches. `courseText` (the course title) picks web or mobile work.
 */
export const projectsForCourse = (list: Project[], courseText = "") => {
  const t = courseText.toLowerCase();
  const type: ProjectType | null = /flutter|mobile/.test(t) ? "mobile" : /web|wordpress/.test(t) ? "website" : null;
  const pool = sortProjects(list).filter((p) => (type ? p.types.includes(type) || (type === "website" && p.types.includes("webapp")) : !!p.learnHref));
  return pool.slice(0, 3);
};
