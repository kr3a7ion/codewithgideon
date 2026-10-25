/* "Watch my intro" on Gideon's photo, shown only when Admin → Site media has
   an intro video (a YouTube link or an uploaded clip). */
import React, { Suspense, lazy, useState } from "react";
import { PlayCircle } from "lucide-react";
import { Dialog } from "../features/shared/Dialog";
import { parseVideo } from "../features/learn/video";
import { useMediaSlot } from "./useSiteMedia";

const VideoPlayer = lazy(() => import("../features/learn/VideoPlayer").then((m) => ({ default: m.VideoPlayer })));

export const IntroVideoButton: React.FC<{ className?: string }> = ({ className }) => {
  const media = useMediaSlot("about.video");
  const [open, setOpen] = useState(false);
  const source = media.custom ? parseVideo(media.src) : null;
  if (!source || source.kind === "link") return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-bold text-blue-900 shadow-card transition hover:bg-white"
        }
      >
        <PlayCircle className="h-5 w-5 text-teal-600" aria-hidden /> Watch my intro
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Hi, I’m Gideon" size="lg">
        {open ? (
          <Suspense fallback={<div className="aspect-video w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}>
            <VideoPlayer source={source} title="Intro from Gideon" />
          </Suspense>
        ) : null}
      </Dialog>
    </>
  );
};
