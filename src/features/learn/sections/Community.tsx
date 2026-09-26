import React from "react";
import { ExternalLink, Users } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton } from "../../../ui";
import { useStudent } from "../StudentDataContext";
import { openExternal } from "../lib";

const Community: React.FC = () => {
  const s = useStudent();
  return (
    <div className="space-y-6">
      <PageHeader
        level={2}
        eyebrow="Community"
        title="Your community spaces"
        description="Cohort rooms, support groups and links for your course."
      />
      {s.communityLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : s.communitySpaces.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No spaces yet"
          description="Spaces appear here once they're published for your cohort or course."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.communitySpaces.map((space) => (
            <article
              key={space.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-300">
                {space.category || "Community"}
              </p>
              <h3 className="mt-2 text-base font-bold text-blue-900 dark:text-white">{space.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{space.description}</p>
              {space.roomUrl ? (
                <div className="mt-auto pt-4">
                  <Button size="sm" onClick={() => openExternal(space.roomUrl)} rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    {space.ctaLabel || "Open space"}
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
