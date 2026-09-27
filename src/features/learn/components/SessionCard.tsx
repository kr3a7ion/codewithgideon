import React from "react";
import { Clock3, PlayCircle, Video } from "lucide-react";
import type { SessionDoc } from "../../../../services/registrationStore";
import { Button, cn } from "../../../ui";
import { formatSessionTime, openExternal } from "../lib";
import { SessionTags } from "./SessionTags";

export const SessionCard: React.FC<{ session: SessionDoc; compact?: boolean }> = ({
  session,
  compact = false,
}) => {
  const recordingUrl = String((session as any).recordingUrl || "").trim();
  const joinUrl = String(session.joinUrl || "").trim();
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 font-display text-sm font-bold text-white dark:bg-teal-500 dark:text-slate-950">
          W{session.week}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Week {session.week}
          </p>
          <h3 className="mt-1 text-base font-bold leading-snug text-blue-900 dark:text-white sm:text-lg">
            {session.title}
          </h3>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <Clock3 className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden />
            {formatSessionTime(session)}
          </p>
          <SessionTags session={session} />
        </div>
      </div>

      {!compact && session.notes ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
          {session.notes}
        </p>
      ) : null}

      {joinUrl || recordingUrl ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {joinUrl ? (
            <Button size="sm" onClick={() => openExternal(joinUrl)} leftIcon={<Video className="h-4 w-4" />}>
              Join class
            </Button>
          ) : null}
          {recordingUrl ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openExternal(recordingUrl)}
              leftIcon={<PlayCircle className="h-4 w-4" />}
            >
              Watch recording
            </Button>
          ) : null}
        </div>
      ) : !compact ? (
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          The class link will appear here before it starts.
        </p>
      ) : null}
    </article>
  );
};
