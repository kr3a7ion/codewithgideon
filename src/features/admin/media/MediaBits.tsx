/* Shared pieces for Site media and anything that picks a picture from it. */
import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, PlayCircle, Upload } from "lucide-react";
import { siteMedia } from "../../../../services/siteMedia";
import type { LibraryItem } from "../../../marketing/mediaSlots";
import { parseVideo, youtubeThumb } from "../../learn/video";
import { Button, cn } from "../../../ui";
import { Dialog } from "../ui";

export const isVideoUrl = (url: string) => {
  const v = parseVideo(url);
  return !!v && v.kind !== "link";
};

/** Thumbnail for a slot value or library item. */
export const Thumb: React.FC<{ url: string; kind: "image" | "video"; aspect: number; className?: string; alt?: string }> = ({
  url,
  kind,
  aspect,
  className,
  alt = "",
}) => {
  const box = cn("relative w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800", className);
  if (!url) {
    return (
      <div className={box} style={{ aspectRatio: String(aspect) }}>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">Not set</span>
      </div>
    );
  }
  if (kind === "video") {
    const v = parseVideo(url);
    const thumb = v?.kind === "youtube" ? youtubeThumb(v.id) : "";
    return (
      <div className={box} style={{ aspectRatio: String(aspect) }}>
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : v?.kind === "file" ? (
          <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="h-10 w-10 text-white drop-shadow" aria-hidden />
        </span>
      </div>
    );
  }
  return (
    <div className={box} style={{ aspectRatio: String(aspect) }}>
      <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
};

/** Upload area used by the picker and the library. */
export const UploadButton: React.FC<{
  accept: string;
  multiple?: boolean;
  label: string;
  onUploaded: (items: LibraryItem[]) => void;
  onError: (msg: string) => void;
  variant?: "primary" | "secondary";
}> = ({ accept, multiple, label, onUploaded, onError, variant = "primary" }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ name: string; pct: number } | null>(null);

  const run = async (files: FileList | null) => {
    if (!files?.length) return;
    const done: LibraryItem[] = [];
    for (const f of Array.from(files)) {
      setBusy({ name: f.name, pct: 0 });
      try {
        done.push(await siteMedia.upload(f, (pct) => setBusy({ name: f.name, pct })));
      } catch (err: any) {
        onError(err?.message || `Couldn't upload ${f.name}.`);
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    if (done.length) onUploaded(done);
  };

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept={accept} multiple={multiple} className="sr-only" id={`up-${label}`} onChange={(e) => run(e.target.files)} />
      <Button variant={variant} size="sm" leftIcon={<Upload className="h-4 w-4" />} loading={!!busy} onClick={() => input.current?.click()}>
        {label}
      </Button>
      {busy ? (
        <div className="max-w-xs">
          <p className="truncate text-xs text-slate-500">
            {busy.pct < 100 ? `Uploading ${busy.name}…` : "Saving…"}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${busy.pct}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
};


/**
 * "Choose picture": upload a new one or pick from the library, and get its
 * link back. Used by forms such as the course editor.
 */
export const MediaPickerButton: React.FC<{
  onPick: (item: LibraryItem) => void;
  label?: string;
  kind?: "image" | "video";
}> = ({ onPick, label = "Choose picture", kind = "image" }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || items) return;
    siteMedia.listLibrary().then(setItems).catch(() => setItems([]));
  }, [open, items]);

  const choose = (i: LibraryItem) => {
    onPick(i);
    setOpen(false);
  };
  const list = (items || []).filter((i) => i.kind === kind);

  return (
    <>
      <Button size="sm" variant="secondary" leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={label} description="Upload a new one or pick from Site media." size="lg">
        <div className="space-y-4">
          <UploadButton
            accept={kind === "video" ? "video/mp4,video/webm" : "image/*"}
            label={kind === "video" ? "Upload a video" : "Upload a picture"}
            onUploaded={(up) => choose(up[0])}
            onError={setError}
          />
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          {items === null ? (
            <p className="text-sm text-slate-500">Loading the library…</p>
          ) : list.length ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {list.map((i) => (
                <button key={i.id} type="button" onClick={() => choose(i)} className="rounded-xl p-0.5 ring-2 ring-transparent transition hover:ring-teal-500">
                  <Thumb url={i.smUrl || i.url} kind={i.kind} aspect={1} alt={i.name} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nothing in the library yet.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};
