/* Shows whether a recording link will play inside the student class page. */
import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { parseVideo, youtubeThumb } from "../../learn/video";

export const RecordingCheck: React.FC<{ url: string }> = ({ url }) => {
  const clean = url.trim();
  if (!clean) return null;
  const v = parseVideo(clean);
  if (!v || !/^https?:\/\//i.test(clean)) {
    return (
      <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> That doesn&rsquo;t look like a full link. It should start with https://
      </p>
    );
  }
  if (v.kind === "youtube") {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2 pr-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <img src={youtubeThumb(v.id)} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
        <p className="text-sm text-emerald-900 dark:text-emerald-100">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Plays inside the class page
          </span>
          <span className="block text-xs opacity-80">
            YouTube video{v.start ? `, starting at ${Math.floor(v.start / 60)}:${String(v.start % 60).padStart(2, "0")}` : ""}. Unlisted videos work; private ones don&rsquo;t.
          </span>
        </p>
      </div>
    );
  }
  if (v.kind === "drive" || v.kind === "file") {
    return (
      <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {v.kind === "drive" ? "Google Drive video: plays in the page if it's shared with “Anyone with the link”." : "Video file: plays in the page."}
      </p>
    );
  }
  return (
    <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> This link opens in a new tab instead of playing in the page. Use an unlisted YouTube link for the best experience.
    </p>
  );
};
