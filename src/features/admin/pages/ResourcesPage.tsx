/* Resources: files and links for students (slides, code, references), with
   uploads and a choice of course, week or class. */
import React, { useMemo, useState } from "react";
import { Code2, ExternalLink, FileText, FolderOpen, Image as ImageIcon, Link2, Pencil, Plus, Presentation, Trash2, Video } from "lucide-react";
import { registrationStore, type ResourceDoc } from "../../../../services/registrationStore";
import { Button } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { ResourceDialog } from "../parts/ResourceDialog";
import { AdminPage, EmptyHint, IconButton, OverflowMenu, Panel, Pill, SearchInput, Spinner, Toggle } from "../ui";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  document: FileText,
  slides: Presentation,
  video: Video,
  code: Code2,
  link: Link2,
  image: ImageIcon,
};

const ResourcesPage: React.FC = () => {
  const { resources, resourcesLoading, resourcesError, paths, pathsById, sessions, cohorts, selectedCohortId, setSelectedCohortId, fetchResources, confirmAction, notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState("all");
  const [editing, setEditing] = useState<ResourceDoc | null | "new">(null);

  const classTitle = useMemo(() => new Map(sessions.map((s: any) => [s.id, `Week ${s.week}: ${s.title}`])), [sessions]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = resources
      .filter((r: any) => pathFilter === "all" || (pathFilter === "none" ? !r.pathId : r.pathId === pathFilter))
      .filter((r: any) => !q || [r.name, r.folder, r.description, r.type].some((v) => String(v || "").toLowerCase().includes(q)));
    const map = new Map<string, ResourceDoc[]>();
    list.forEach((r: any) => {
      const k = String(r.folder || "General").trim() || "General";
      map.set(k, [...(map.get(k) || []), r]);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [resources, search, pathFilter]);

  const toggle = async (r: ResourceDoc) => {
    try {
      await registrationStore.updateResource(r.id, { isPublished: r.isPublished === false });
      await fetchResources();
    } catch (err: any) {
      notify("error", err?.message || "Couldn't update it.");
    }
  };

  const remove = async (r: ResourceDoc) => {
    const ok = await confirmAction({ title: "Delete this resource?", message: `Students will no longer see “${r.name}”.`, confirmLabel: "Delete", tone: "danger" });
    if (!ok) return;
    try {
      await registrationStore.deleteResource(r.id);
      await fetchResources();
      notify("success", "Resource deleted.");
    } catch (err: any) {
      notify("error", err?.message || "Couldn't delete it.");
    }
  };

  const total = groups.reduce((n, [, l]) => n + l.length, 0);

  return (
    <AdminPage
      title="Resources"
      description="Slides, starter code and links. Students see visible resources for their course, and on the class page when you tie one to a class or week."
      actions={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add resource</Button>}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search resources" className="sm:w-72" />
        <label className="sr-only" htmlFor="res-filter">Course</label>
        <select
          id="res-filter"
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="all">All courses</option>
          <option value="none">Every course (shared)</option>
          {paths.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {resourcesError ? <p className="text-sm font-semibold text-red-600">{resourcesError}</p> : null}

      {resourcesLoading && resources.length === 0 ? (
        <Spinner label="Loading resources" />
      ) : total === 0 ? (
        <Panel>
          <EmptyHint
            icon={<FolderOpen className="h-5 w-5" />}
            title={resources.length ? "Nothing matches" : "No resources yet"}
            action={resources.length ? undefined : <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add the first one</Button>}
          >
            {resources.length ? "Try another search or course." : "Upload slides or paste a link. Students see them in Resources and on class pages."}
          </EmptyHint>
        </Panel>
      ) : (
        groups.map(([folder, list]) => (
          <Panel key={folder} title={folder} description={`${list.length} item${list.length === 1 ? "" : "s"}`} padded={false}>
            <ul className="divide-y divide-line dark:divide-line-dark">
              {list.map((r: any) => {
                const Icon = ICONS[String(r.type || "").toLowerCase()] || FileText;
                const where = [
                  r.pathId ? pathsById.get(r.pathId)?.title || "A course" : "Every course",
                  r.sessionId ? classTitle.get(r.sessionId) || "One class" : r.sessionWeek ? `Week ${r.sessionWeek}` : "",
                ].filter(Boolean);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950">
                      <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {r.name}
                        {r.isPublished === false ? <Pill>Hidden</Pill> : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {r.type}
                        {r.size ? ` · ${r.size}` : ""} · {where.join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-28">
                        <Toggle checked={r.isPublished !== false} onChange={() => toggle(r)} label="Visible" />
                      </div>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                      <IconButton label={`Edit ${r.name}`} onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </IconButton>
                      <OverflowMenu items={[{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => remove(r) }]} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))
      )}

      <ResourceDialog open={editing !== null} onClose={() => setEditing(null)} resource={editing === "new" ? null : editing} />
    </AdminPage>
  );
};

export default ResourcesPage;
