import React, { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Skeleton, inputClass } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { LockedNotice } from "../components/LockedNotice";
import { openExternal } from "../lib";

const Resources: React.FC = () => {
  const s = useStudent();
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return s.resources;
    return s.resources.filter((r) =>
      [r.name, r.description, r.folder, r.type].some((v) => String(v || "").toLowerCase().includes(q)),
    );
  }, [s.resources, term]);

  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Resources"
        title="Course materials"
        description="Slides, links and downloads published for your course."
      />

      {s.isLocked ? (
        <LockedNotice
          title="Resources unlock after payment"
          body="Complete your payment and your course materials appear here automatically."
        />
      ) : s.resourcesLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : s.resources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No resources yet"
          description="Materials appear here once they're published for your course or cohort."
        />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search materials"
              aria-label="Search materials"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((resource) => (
              <article
                key={resource.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {resource.folder || "General"} · {resource.type}
                  </p>
                  {resource.sessionWeek ? <Badge tone="teal">Week {resource.sessionWeek}</Badge> : null}
                </div>
                <h3 className="mt-2 text-base font-bold text-blue-900 dark:text-white">{resource.name}</h3>
                {resource.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.description}</p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{resource.size || ""}</span>
                  <Button size="sm" onClick={() => openExternal(resource.url)} rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No materials match “{term}”.</p>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Resources;
