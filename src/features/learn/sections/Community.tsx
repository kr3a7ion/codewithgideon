import React from "react";
import { ExternalLink, Users } from "lucide-react";
import { mbtn } from "../../../marketing/ui";
import { Card, IconTile } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { SpaceCardsBone } from "../Skeleton";
import { EmptyCard } from "../ui";

const Community: React.FC = () => {
  const s = useStudent();
  return (
    <div className="space-y-5 lg:space-y-6">
      <StudentPageHeader title="Community" description="Cohort rooms, study groups and links for your course." />
      {s.communityLoading ? (
        <SpaceCardsBone />
      ) : s.communitySpaces.length === 0 ? (
        <EmptyCard icon={Users} title="No spaces yet">
          Cohort rooms and study groups show here once Gideon opens them for your course.
        </EmptyCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.communitySpaces.map((space) => (
            <Card as="article" key={space.id} className="flex flex-col gap-3 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <IconTile icon={Users} size="sm" />
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-teal-700 dark:text-teal-300">{space.category || "Community"}</p>
              </div>
              <h2 className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">{space.title}</h2>
              {space.description ? <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{space.description}</p> : <div className="flex-1" />}
              {space.roomUrl ? (
                <a href={space.roomUrl} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary", size: "sm", className: "self-start" })}>
                  {space.ctaLabel || "Open space"} <ExternalLink className="h-4 w-4" aria-hidden />
                  <span className="sr-only">: {space.title}</span>
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
