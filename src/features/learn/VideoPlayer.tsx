import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, PlayCircle, RotateCcw } from "lucide-react";
import { cn } from "../../ui";
import { clock, type VideoSource, youtubeThumb } from "./video";

// ---------------------------------------------------------------------------
// YouTube IFrame API, loaded once on first use.
// ---------------------------------------------------------------------------

type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
const loadYouTube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("youtube_api_failed"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
};

export type PlaybackUpdate = { position: number; duration: number; ended?: boolean };

const SAVE_EVERY_MS = 10_000;

/**
 * Plays a class recording inside the page. YouTube recordings resume where
 * the student left off and report progress; Drive and video files play
 * inline too. Anything else is a link.
 */
export const VideoPlayer: React.FC<{
  source: VideoSource;
  title: string;
  /** Where to start (resume point), in seconds. */
  startAt?: number;
  onProgress?: (u: PlaybackUpdate) => void;
  className?: string;
}> = ({ source, title, startAt = 0, onProgress, className }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const [failed, setFailed] = useState(false);
  // YouTube waits for a tap before loading the player: lighter pages, and
  // nothing autoplays.
  // The resume point is fixed when play is pressed, so saving progress
  // (which moves the resume point) never reloads the player.
  const [startFrom, setStartFrom] = useState<number | null>(null);
  const started = startFrom !== null;

  const ytId = source.kind === "youtube" ? source.id : "";
  const ytStart = Math.floor(startAt || (source.kind === "youtube" ? source.start : 0));

  useEffect(() => {
    if (!ytId || startFrom === null || !hostRef.current) return;
    let cancelled = false;
    let timer = 0;
    const report = (ended = false) => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const duration = p.getDuration() || 0;
        const position = ended ? duration : p.getCurrentTime() || 0;
        if (duration > 0) progressRef.current?.({ position, duration, ended });
      } catch {
        /* player gone */
      }
    };
    const mount = document.createElement("div");
    hostRef.current.appendChild(mount);
    loadYouTube()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: ytId,
          width: "100%",
          height: "100%",
          playerVars: { start: startFrom, autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
          events: {
            onStateChange: (e: { data: number }) => {
              window.clearInterval(timer);
              if (e.data === YT.PlayerState.PLAYING) timer = window.setInterval(() => report(), SAVE_EVERY_MS);
              else if (e.data === YT.PlayerState.ENDED) report(true);
              else if (e.data === YT.PlayerState.PAUSED) report();
            },
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => !cancelled && setFailed(true));
    const onHide = () => document.visibilityState === "hidden" && report();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      report();
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
      mount.remove();
    };
  }, [ytId, startFrom]);

  const frame = "relative aspect-video w-full overflow-hidden rounded-[20px] bg-slate-950";
  const watchUrl = source.kind === "youtube" ? `https://www.youtube.com/watch?v=${source.id}${ytStart ? `&t=${ytStart}s` : ""}` : source.kind === "drive" ? `https://drive.google.com/file/d/${source.id}/view` : source.url;

  if (failed || source.kind === "link") {
    return (
      <div className={cn(frame, "flex flex-col items-center justify-center gap-3 px-6 text-center", className)}>
        <PlayCircle className="h-10 w-10 text-teal-300" aria-hidden />
        <p className="max-w-sm text-[15px] font-semibold text-white">
          {failed ? "This recording can't play here." : "This recording opens on another site."}
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-400 px-4 text-[15px] font-bold text-blue-950 hover:bg-teal-300"
        >
          Open the recording <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    );
  }

  if (source.kind === "drive") {
    return (
      <div className={cn(frame, className)}>
        <iframe
          title={title}
          src={`https://drive.google.com/file/d/${source.id}/preview`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  if (source.kind === "file") {
    return (
      <div className={cn(frame, className)}>
        <video
          className="absolute inset-0 h-full w-full"
          src={source.url}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            if (startAt > 0) e.currentTarget.currentTime = startAt;
          }}
          onPause={(e) => progressRef.current?.({ position: e.currentTarget.currentTime, duration: e.currentTarget.duration || 0 })}
          onEnded={(e) => progressRef.current?.({ position: e.currentTarget.duration, duration: e.currentTarget.duration, ended: true })}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            const now = Date.now();
            const last = Number(v.dataset.saved || 0);
            if (now - last > SAVE_EVERY_MS) {
              v.dataset.saved = String(now);
              progressRef.current?.({ position: v.currentTime, duration: v.duration || 0 });
            }
          }}
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  // YouTube
  return (
    <div className={cn(frame, className)}>
      <div ref={hostRef} className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full" />
      {!started ? (
        <button
          type="button"
          onClick={() => setStartFrom(ytStart)}
          className="group absolute inset-0 flex items-center justify-center bg-cover bg-center focus-visible:outline-none"
          style={{ backgroundImage: `linear-gradient(rgba(8,21,46,.35), rgba(8,21,46,.55)), url(${youtubeThumb(source.id)})` }}
        >
          <span className="flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-400 text-blue-950 shadow-lg transition-transform group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-teal-200">
              <PlayCircle className="h-9 w-9" aria-hidden />
            </span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-sm font-bold text-white">
              {ytStart > 5 ? (
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Resume from {clock(ytStart)}
                </span>
              ) : (
                "Play recording"
              )}
            </span>
          </span>
          <span className="sr-only">: {title}</span>
        </button>
      ) : null}
    </div>
  );
};
