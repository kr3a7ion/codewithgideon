import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { ResourceDoc } from "../../../../services/registrationStore";
import { mbtn } from "../../../marketing/ui";
import { Dialog } from "../../shared/Dialog";
import { VideoPlayer } from "../VideoPlayer";
import { viewFor } from "../video";

/** Opens a resource inside the app: slides, Docs, Drive files, PDFs, images and videos. */
export const ResourceViewer: React.FC<{
  resource: ResourceDoc | null;
  onClose: () => void;
  /** The class this resource belongs to, when known. */
  classLink?: { to: string; title: string } | null;
}> = ({ resource, onClose, classLink }) => {
  const r = resource as any;
  const view = r ? viewFor(r.url) : null;
  return (
    <Dialog open={!!r} onClose={onClose} title={r?.name || "Resource"} size="lg" className="student-app" description={r?.description || undefined}>
      {r && view ? (
        <div className="space-y-4">
          {view.kind === "video" ? (
            <VideoPlayer source={view.video} title={r.name || "Video"} />
          ) : view.kind === "image" ? (
            <img src={view.src} alt={r.name || ""} className="max-h-[70vh] w-full rounded-2xl bg-paper object-contain dark:bg-slate-800" />
          ) : (
            <iframe title={r.name || "Resource"} src={view.src} className="h-[65vh] w-full rounded-2xl border border-line bg-white dark:border-line-dark" allow="fullscreen" />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {classLink ? (
              <Link to={classLink.to} onClick={onClose} className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">
                From the class: {classLink.title}
              </Link>
            ) : (
              <span />
            )}
            <a href={r.url} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary" })}>
              Open in a new tab <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};
