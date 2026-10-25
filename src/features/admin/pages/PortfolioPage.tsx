/* Portfolio: every project shown on the public Portfolio page — your own
   products, client work and sample demos — with pictures from Site media. */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Briefcase, Download, ImageOff, Pencil, Plus, RotateCw, Star, Trash2, X } from "lucide-react";
import { catalog, catalogError } from "../../../../services/catalog";
import {
  OWNERSHIP_LABEL,
  PROJECT_STARTERS,
  PROJECT_TYPES,
  STATUS_LABEL,
  projectTypeLabel,
  type Ownership,
  type Project,
  type ProjectImage,
  type ProjectStatus,
  type ProjectType,
} from "../../../marketing/catalog";
import { refreshCatalog } from "../../../marketing/useCatalog";
import { coursePathFromValue } from "../../../../utils/courseRoutes";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { MediaPickerButton } from "../media/MediaBits";
import { AdminPage, Dialog, EmptyHint, IconButton, OverflowMenu, Panel, Pill, Spinner, Toggle } from "../ui";
import { linesToList } from "./PackagesPage";

const blank = (order: number): Project => ({
  id: "",
  slug: "",
  title: "",
  kind: "",
  types: ["website"],
  ownership: "own",
  status: "live",
  summary: "",
  brief: "",
  role: "",
  year: String(new Date().getFullYear()),
  features: [],
  tech: [],
  links: {},
  cover: null,
  gallery: [],
  featured: false,
  published: false,
  order,
});

const LINKS: { key: keyof Project["links"]; label: string; placeholder: string }[] = [
  { key: "live", label: "Live site", placeholder: "https://…" },
  { key: "demo", label: "Live demo", placeholder: "https://…" },
  { key: "playStore", label: "Google Play", placeholder: "https://play.google.com/store/apps/details?id=…" },
  { key: "appStore", label: "App Store", placeholder: "https://apps.apple.com/…" },
  { key: "github", label: "Code (GitHub)", placeholder: "https://github.com/…" },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4">
    <h3 className="border-b border-line pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-line-dark">{title}</h3>
    {children}
  </section>
);

const ProjectDialog: React.FC<{
  project: Project | null;
  existingIds: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ project, existingIds, onClose, onSaved }) => {
  const { notify, courses } = useAdmin();
  const [f, setF] = useState<Project>(blank(1));
  const [features, setFeatures] = useState("");
  const [tech, setTech] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pkgs, setPkgs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!project) return;
    setF(project);
    setFeatures(project.features.join("\n"));
    setTech(project.tech.join(", "));
    setError("");
    catalog
      .listPackages()
      .then((list) => setPkgs(list.length ? list : []))
      .catch(() => setPkgs([]));
  }, [project]);

  if (!project) return null;
  const set = (patch: Partial<Project>) => setF((p) => ({ ...p, ...patch }));
  const setLink = (k: keyof Project["links"], v: string) => setF((p) => ({ ...p, links: { ...p.links, [k]: v } }));
  const setImage = (i: number, patch: Partial<ProjectImage>) =>
    setF((p) => ({ ...p, gallery: p.gallery.map((g, k) => (k === i ? { ...g, ...patch } : g)) }));
  const moveImage = (i: number, dir: -1 | 1) =>
    setF((p) => {
      const g = [...p.gallery];
      const j = i + dir;
      if (j < 0 || j >= g.length) return p;
      [g[i], g[j]] = [g[j], g[i]];
      return { ...p, gallery: g };
    });
  const isNew = !project.id;
  const courseOptions = (courses || []).map((c: any) => ({ href: coursePathFromValue(c), title: c.title }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = f.title.trim();
    if (title.length < 2) return setError("Give the project a name.");
    if (!f.types.length) return setError("Choose at least one type.");
    const badLink = Object.entries(f.links).find(([, v]) => v && !/^https?:\/\//.test(String(v)));
    if (badLink) return setError("Links must start with https://");
    let id = f.id || catalog.slugify(title);
    if (isNew) {
      let n = 2;
      const base = id;
      while (existingIds.includes(id)) id = `${base}-${n++}`;
    }
    const links = Object.fromEntries(Object.entries(f.links).filter(([, v]) => String(v || "").trim()).map(([k, v]) => [k, String(v).trim()]));
    setSaving(true);
    setError("");
    try {
      await catalog.saveProject({
        ...f,
        id,
        title,
        slug: f.slug || id,
        summary: f.summary.trim(),
        brief: f.brief.trim(),
        features: linesToList(features).slice(0, 20),
        tech: tech.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20),
        links,
        gallery: f.gallery.slice(0, 24),
      });
      await refreshCatalog();
      notify("success", f.published ? `${title} saved. It's live on the Portfolio page.` : `${title} saved as a draft.`);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(catalogError(err, "Couldn't save the project."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? "Add a project" : `Edit ${project.title}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="project-form" loading={saving}>
            {f.published ? "Save and show" : "Save draft"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={save} className="space-y-7">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name" htmlFor="pj-title">
              <input id="pj-title" value={f.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} data-autofocus />
            </Field>
            <Field label="What it is" htmlFor="pj-kind" hint="Short, e.g. “Hotel management system”.">
              <input id="pj-kind" value={f.kind} onChange={(e) => set({ kind: e.target.value })} maxLength={60} className={inputClass} />
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Type (pick all that fit)</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((t) => {
                const on = f.types.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ types: on ? f.types.filter((x) => x !== t.value) : [...f.types, t.value as ProjectType] })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      on ? "border-blue-900 bg-blue-900 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950" : "border-line text-slate-600 hover:bg-slate-50 dark:border-line-dark dark:text-slate-300",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Whose project" htmlFor="pj-own">
              <select id="pj-own" value={f.ownership} onChange={(e) => set({ ownership: e.target.value as Ownership })} className={inputClass}>
                {(Object.keys(OWNERSHIP_LABEL) as Ownership[]).map((k) => (
                  <option key={k} value={k}>{OWNERSHIP_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="pj-status">
              <select id="pj-status" value={f.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })} className={inputClass}>
                {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((k) => (
                  <option key={k} value={k}>{STATUS_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Year" htmlFor="pj-year">
              <input id="pj-year" value={f.year} onChange={(e) => set({ year: e.target.value })} maxLength={12} className={inputClass} />
            </Field>
          </div>
          <Field label="Your role" htmlFor="pj-role" hint="e.g. “Flutter developer”, “Design and build”.">
            <input id="pj-role" value={f.role} onChange={(e) => set({ role: e.target.value })} maxLength={80} className={inputClass} />
          </Field>
        </Section>

        <Section title="The story">
          <Field label="Card summary" htmlFor="pj-sum" hint="One or two sentences, shown on the project card.">
            <textarea id="pj-sum" rows={2} value={f.summary} onChange={(e) => set({ summary: e.target.value })} maxLength={300} className={inputClass} />
          </Field>
          <Field label="The brief" htmlFor="pj-brief" hint="The problem it solves or who it's for. Top of the case study.">
            <textarea id="pj-brief" rows={3} value={f.brief} onChange={(e) => set({ brief: e.target.value })} maxLength={800} className={inputClass} />
          </Field>
          <Field label="What it does" htmlFor="pj-feat" hint="One feature per line.">
            <textarea id="pj-feat" rows={5} value={features} onChange={(e) => setFeatures(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Built with" htmlFor="pj-tech" hint="Separate with commas: React, Firebase, Flutter.">
            <input id="pj-tech" value={tech} onChange={(e) => setTech(e.target.value)} className={inputClass} />
          </Field>
        </Section>

        <Section title="Pictures">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-full sm:w-56">
              {f.cover?.url ? (
                <div className="relative">
                  <img src={f.cover.smUrl || f.cover.url} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
                  <IconButton label="Remove cover" onClick={() => set({ cover: null })} className="absolute right-1 top-1 h-8 w-8 bg-white/90 dark:bg-slate-900/90">
                    <X className="h-4 w-4" aria-hidden />
                  </IconButton>
                </div>
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <ImageOff className="h-6 w-6" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cover picture</p>
              <p className="text-xs text-slate-500">Shown on the card. Landscape works best (16:10), e.g. the app on a laptop and phone.</p>
              <MediaPickerButton
                label={f.cover ? "Change cover" : "Choose cover"}
                onPick={(i) => set({ cover: { url: i.url, smUrl: i.smUrl, alt: f.cover?.alt || `${f.title || "Project"} screenshot` } })}
              />
              {f.cover ? (
                <input
                  aria-label="Describe the cover picture"
                  value={f.cover.alt}
                  onChange={(e) => set({ cover: { ...f.cover!, alt: e.target.value } })}
                  placeholder="Describe the picture"
                  className={inputClass}
                />
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Screenshots ({f.gallery.length})</p>
              <MediaPickerButton
                label="Add screenshot"
                onPick={(i) => set({ gallery: [...f.gallery, { url: i.url, smUrl: i.smUrl, alt: `${f.title || "Project"} screenshot`, caption: "" }] })}
              />
            </div>
            {f.gallery.length ? (
              <ul className="space-y-2">
                {f.gallery.map((g, i) => (
                  <li key={`${g.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-line p-2 dark:border-line-dark">
                    <img src={g.smUrl || g.url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    <input
                      aria-label={`Caption for screenshot ${i + 1}`}
                      value={g.caption || ""}
                      onChange={(e) => setImage(i, { caption: e.target.value, alt: e.target.value || g.alt })}
                      placeholder="Caption, e.g. “Booking on a phone”"
                      className={cn(inputClass, "py-2")}
                    />
                    <IconButton label="Move up" disabled={i === 0} onClick={() => moveImage(i, -1)} className="h-9 w-9">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === f.gallery.length - 1} onClick={() => moveImage(i, 1)} className="h-9 w-9">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton label="Remove screenshot" onClick={() => set({ gallery: f.gallery.filter((_, k) => k !== i) })} className="h-9 w-9 text-red-600">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No screenshots yet. They show as a gallery on the case study.</p>
            )}
          </div>
        </Section>

        <Section title="Links">
          <div className="grid gap-4 sm:grid-cols-2">
            {LINKS.map((l) => (
              <Field key={l.key} label={l.label} htmlFor={`pj-l-${l.key}`}>
                <input
                  id={`pj-l-${l.key}`}
                  type="url"
                  value={f.links[l.key] || ""}
                  onChange={(e) => setLink(l.key, e.target.value)}
                  placeholder={l.placeholder}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Suggest next">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hire package" htmlFor="pj-pkg" hint="“Want one like this?” on the case study.">
              <select id="pj-pkg" value={f.packageId || ""} onChange={(e) => set({ packageId: e.target.value || undefined })} className={inputClass}>
                <option value="">None</option>
                {(pkgs.length ? pkgs : [{ id: f.packageId || "", name: f.packageId || "" }]).filter((p) => p.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Course" htmlFor="pj-learn" hint="“Learn to build this” on the case study.">
              <select id="pj-learn" value={f.learnHref || ""} onChange={(e) => set({ learnHref: e.target.value || undefined })} className={inputClass}>
                <option value="">None</option>
                <option value="/courses">All courses</option>
                {courseOptions.map((c: any) => (
                  <option key={c.href} value={c.href}>{c.title}</option>
                ))}
                {f.learnHref && f.learnHref !== "/courses" && !courseOptions.some((c: any) => c.href === f.learnHref) ? (
                  <option value={f.learnHref}>{f.learnHref}</option>
                ) : null}
              </select>
            </Field>
          </div>
        </Section>

        <section className="space-y-3 rounded-2xl border border-line p-4 dark:border-line-dark">
          <Toggle checked={f.published} onChange={(v) => set({ published: v })} label="Show on the site" description="Off keeps it as a private draft." />
          <Toggle checked={f.featured} onChange={(v) => set({ featured: v })} label="Feature on the home page" description="Featured projects show first, on the home page too." />
        </section>
        {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

const PortfolioPage: React.FC = () => {
  const { notify, confirmAction } = useAdmin();
  const [items, setItems] = useState<Project[] | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await catalog.listProjects();
      setItems(list);
      setLoadError("");
      return list;
    } catch (err: any) {
      setLoadError(catalogError(err, "Couldn't load the portfolio."));
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empty = items !== null && items.length === 0;
  const shown = useMemo(() => (empty ? PROJECT_STARTERS : items || []), [empty, items]);

  /** The site shows the built-in projects until they're saved here, so the
   *  first change saves them all; nothing disappears from the public page. */
  const ensureImported = async (): Promise<Project[]> => {
    if (!empty) return items || [];
    setImporting(true);
    try {
      await catalog.seedProjects();
      const list = (await load()) || [];
      await refreshCatalog();
      return list;
    } finally {
      setImporting(false);
    }
  };

  const run = async (fn: (list: Project[]) => Promise<void> | void, fallback = "Couldn't save the change.") => {
    try {
      await fn(await ensureImported());
    } catch (err: any) {
      notify("error", catalogError(err, fallback));
      load();
    }
  };
  const find = (list: Project[], p: Project) => list.find((x) => x.id === p.id) || p;

  const importStarters = () =>
    run(() => notify("success", "Projects imported. Add pictures to each one next."), "Couldn't import.");

  const edit = (p: Project) => run((list) => setEditing(find(list, p)));
  const add = () => run((list) => setEditing(blank(list.length + 1)));

  const update = (p: Project, patch: Partial<Project>) =>
    run(async (list) => {
      await catalog.saveProject({ ...find(list, p), ...patch });
      await Promise.all([load(), refreshCatalog()]);
    });

  const move = (id: string, dir: -1 | 1) =>
    run(async (current) => {
      const list = [...current];
      const i = list.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      setItems(list.map((p, k) => ({ ...p, order: k + 1 })));
      await catalog.reorder("portfolio", list);
      await refreshCatalog();
    });

  const remove = async (p: Project) => {
    const ok = await confirmAction({
      title: `Delete ${p.title}?`,
      message: "It's removed from the portfolio. Its pictures stay in Site media. To hide it for now, turn off “Show on the site”.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    await run(async () => {
      await catalog.removeProject(p.id);
      await Promise.all([load(), refreshCatalog()]);
      notify("success", "Project deleted.");
    }, "Couldn't delete the project.");
  };

  const live = shown.filter((p) => p.published).length;

  return (
    <AdminPage
      title="Portfolio"
      description="Your projects on the public Portfolio page: your own products, client work and demos."
      actions={
        items !== null ? (
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={importing} onClick={add}>
            Add project
          </Button>
        ) : null
      }
    >
      {loadError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {loadError}
          </p>
          <Button size="sm" variant="secondary" leftIcon={<RotateCw className="h-4 w-4" />} onClick={load}>
            Try again
          </Button>
        </div>
      ) : null}
      {items === null ? (
        loadError ? null : <Spinner label="Loading the portfolio" />
      ) : (
        <>
          {empty ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-100 sm:flex-row sm:items-center sm:justify-between">
              <p>
                The site is showing these built-in projects. Edit, hide, reorder or delete any of them, or add your own; the first change saves them all here. FacilityFlow and Day Book come in as hidden drafts.
              </p>
              <Button size="sm" className="shrink-0 whitespace-nowrap" leftIcon={<Download className="h-4 w-4" />} loading={importing} onClick={importStarters}>
                Import projects
              </Button>
            </div>
          ) : null}
          <Panel title="Projects" description={`${live} on the site · ${shown.length - live} draft${shown.length - live === 1 ? "" : "s"}`} padded={false}>
            {shown.length === 0 ? (
              <EmptyHint icon={<Briefcase className="h-5 w-5" />} title="No projects yet" />
            ) : (
              <ul className="divide-y divide-line dark:divide-line-dark">
                {shown.map((p, i) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-5">
                    <div className="w-24 shrink-0 sm:w-28">
                      {p.cover?.url ? (
                        <img src={p.cover.smUrl || p.cover.url} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
                      ) : (
                        <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-400 dark:bg-slate-800">
                          No picture
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        {p.title}
                        {p.featured ? <Star className="h-4 w-4 fill-orange-400 text-orange-400" aria-label="Featured" /> : null}
                        {!p.published ? <Pill>Draft</Pill> : null}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {p.kind || p.types.map(projectTypeLabel).join(", ")} · {OWNERSHIP_LABEL[p.ownership]} · {STATUS_LABEL[p.status]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-28">
                          <Toggle checked={p.published} onChange={(v) => update(p, { published: v })} label="On site" />
                        </div>
                        <IconButton label="Move up" disabled={i === 0} onClick={() => move(p.id, -1)}>
                          <ArrowUp className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton label="Move down" disabled={i === shown.length - 1} onClick={() => move(p.id, 1)}>
                          <ArrowDown className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton label={`Edit ${p.title}`} disabled={importing} onClick={() => edit(p)}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <OverflowMenu
                          items={[
                            { label: p.featured ? "Stop featuring" : "Feature on home", icon: <Star className="h-4 w-4" />, onSelect: () => update(p, { featured: !p.featured }) },
                            { label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => remove(p) },
                          ]}
                        />
                      </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
      <ProjectDialog project={editing} existingIds={(items || []).map((p) => p.id)} onClose={() => setEditing(null)} onSaved={load} />
    </AdminPage>
  );
};

export default PortfolioPage;
