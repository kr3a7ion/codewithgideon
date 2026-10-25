/* Site media: change the pictures (and an intro video) on the public pages,
   and manage everything uploaded for them. */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ImagePlus, Link2, RotateCcw, Trash2, Video } from "lucide-react";
import { siteMedia } from "../../../../services/siteMedia";
import { MEDIA_SLOTS, type LibraryItem, type MediaSlot, type SlotValue } from "../../../marketing/mediaSlots";
import { refreshSiteMedia } from "../../../marketing/useSiteMedia";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { formatBytes } from "../media/processImage";
import { Thumb, UploadButton, isVideoUrl } from "../media/MediaBits";
import { AdminPage, Dialog, EmptyHint, Panel, Pill, Segmented, Spinner, relativeTime } from "../ui";

type Tab = "site" | "library";

/** Choose a new picture or video for one slot. */
const SlotDialog: React.FC<{
  slot: MediaSlot | null;
  value?: SlotValue;
  library: LibraryItem[];
  onClose: () => void;
  onLibraryChange: (items: LibraryItem[]) => void;
  onSaved: () => void;
}> = ({ slot, value, library, onClose, onLibraryChange, onSaved }) => {
  const { notify } = useAdmin();
  const [picked, setPicked] = useState<LibraryItem | null>(null);
  const [link, setLink] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slot) return;
    setPicked(value?.libraryId ? library.find((i) => i.id === value.libraryId) || null : null);
    setLink(slot.kind === "video" && value?.url && !value.libraryId ? value.url : "");
    setAlt(value?.alt || slot.defaultAlt);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot?.id]);

  if (!slot) return null;
  const choices = library.filter((i) => i.kind === slot.kind);
  const linkOk = slot.kind === "video" && link.trim() && isVideoUrl(link.trim());
  const previewUrl = picked?.url || (linkOk ? link.trim() : "") || value?.url || slot.defaultSrc;

  const save = async () => {
    setError("");
    if (slot.kind === "video" && link.trim() && !linkOk) {
      setError("That link isn't a YouTube video or a video file.");
      return;
    }
    if (!picked && !linkOk) {
      setError(slot.kind === "video" ? "Paste a YouTube link, or upload or pick a video." : "Upload a picture or pick one from the library.");
      return;
    }
    setSaving(true);
    try {
      await siteMedia.saveSlot(
        slot.id,
        picked
          ? { url: picked.url, smUrl: picked.smUrl, width: picked.width, height: picked.height, kind: picked.kind, libraryId: picked.id, alt }
          : { url: link.trim(), kind: "video", alt },
      );
      await refreshSiteMedia();
      notify("success", `${slot.label} updated. It's live on the site now.`);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={slot.label}
      description={slot.where}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Use this</Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <UploadButton
              accept={slot.kind === "video" ? "video/mp4,video/webm" : "image/*"}
              label={slot.kind === "video" ? "Upload a video" : "Upload a picture"}
              onUploaded={(items) => {
                onLibraryChange(items);
                setPicked(items[0]);
                setLink("");
              }}
              onError={setError}
            />
            <p className="text-xs text-slate-500">Best size: {slot.hint}.{slot.kind === "image" ? " Photos are shrunk automatically." : ""}</p>
          </div>

          {slot.kind === "video" ? (
            <Field label="Or paste a YouTube link" htmlFor="slot-link" hint="Unlisted videos work. Best for anything longer than a minute.">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="slot-link"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    if (e.target.value) setPicked(null);
                  }}
                  placeholder="https://youtu.be/..."
                  className={cn(inputClass, "pl-10")}
                />
              </div>
            </Field>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {choices.length ? "Or pick from the library" : "The library is empty"}
            </p>
            {choices.length ? (
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                {choices.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      setPicked(i);
                      setLink("");
                    }}
                    aria-pressed={picked?.id === i.id}
                    className={cn(
                      "rounded-xl p-0.5 ring-2 transition",
                      picked?.id === i.id ? "ring-teal-500" : "ring-transparent hover:ring-slate-300 dark:hover:ring-slate-600",
                    )}
                  >
                    <Thumb url={i.smUrl || i.url} kind={i.kind} aspect={1} alt={i.name} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {slot.kind === "image" ? (
            <Field label="Describe the picture" htmlFor="slot-alt" hint="Read out by screen readers and used by Google.">
              <input id="slot-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className={inputClass} />
            </Field>
          ) : null}
          {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</p>
          <Thumb url={previewUrl} kind={slot.kind} aspect={slot.aspect} alt={alt} />
          {picked ? (
            <p className="mt-2 truncate text-xs text-slate-500">
              {picked.name} · {formatBytes(picked.size)}
              {picked.width ? ` · ${picked.width} × ${picked.height}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};

const MediaPage: React.FC = () => {
  const { notify, confirmAction } = useAdmin();
  const [tab, setTab] = useState<Tab>("site");
  const [slots, setSlots] = useState<Record<string, SlotValue> | null>(null);
  const [library, setLibrary] = useState<LibraryItem[] | null>(null);
  const [editing, setEditing] = useState<MediaSlot | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([siteMedia.getSlots(), siteMedia.listLibrary()]);
      setSlots(s);
      setLibrary(l);
    } catch (err: any) {
      setError(err?.message || "Couldn't load site media.");
      setSlots({});
      setLibrary([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usedBy = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(slots || {}).forEach(([id, v]) => {
      const key = v.libraryId || v.url;
      (map[key] ||= []).push(MEDIA_SLOTS.find((s) => s.id === id)?.label || id);
    });
    return map;
  }, [slots]);

  const reset = async (slot: MediaSlot) => {
    const ok = await confirmAction({
      title: slot.optional ? `Remove ${slot.label.toLowerCase()}?` : "Go back to the built-in picture?",
      message: slot.optional ? "It disappears from the site. The file stays in the library." : "Your upload stays in the library, so you can use it again later.",
      confirmLabel: slot.optional ? "Remove" : "Reset",
      tone: "warning",
    });
    if (!ok) return;
    await siteMedia.resetSlot(slot.id);
    await refreshSiteMedia();
    await load();
    notify("success", `${slot.label} reset.`);
  };

  const removeItem = async (item: LibraryItem) => {
    const uses = usedBy[item.id] || usedBy[item.url] || [];
    if (uses.length) {
      notify("error", `It's in use (${uses.join(", ")}). Replace or reset it there first.`);
      return;
    }
    const ok = await confirmAction({
      title: "Delete this file?",
      message: `${item.name} will be deleted from Storage. This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await siteMedia.remove(item);
      setLibrary((l) => (l || []).filter((x) => x.id !== item.id));
      notify("success", "Deleted.");
    } catch (err: any) {
      notify("error", err?.message || "Couldn't delete it.");
    }
  };

  const groups = useMemo(() => {
    const out: Record<string, MediaSlot[]> = {};
    MEDIA_SLOTS.forEach((s) => (out[s.page] ||= []).push(s));
    return Object.entries(out);
  }, []);

  return (
    <AdminPage
      title="Site media"
      description="Change the pictures on the public pages, or add an intro video. Changes go live straight away."
    >
      <Segmented<Tab>
        label="Site media view"
        value={tab}
        onChange={setTab}
        options={[
          { value: "site", label: "On the site", count: MEDIA_SLOTS.length },
          { value: "library", label: "Library", count: library?.length },
        ]}
      />
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {slots === null || library === null ? (
        <Spinner label="Loading site media" />
      ) : tab === "site" ? (
        groups.map(([page, list]) => (
          <Panel key={page} title={page} padded={false}>
            <ul className="divide-y divide-line dark:divide-line-dark">
              {list.map((slot) => {
                const v = slots[slot.id];
                const url = v?.smUrl || v?.url || slot.defaultSrc;
                return (
                  <li key={slot.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-5">
                    <div className="w-24 shrink-0 sm:w-40">
                      <Thumb url={url} kind={v?.kind || slot.kind} aspect={slot.aspect} alt={v?.alt || slot.defaultAlt} />
                    </div>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        {slot.kind === "video" ? <Video className="h-4 w-4 text-slate-400" aria-hidden /> : null}
                        {slot.label}
                        {v ? <Pill tone="teal">Your upload</Pill> : slot.optional ? <Pill>Off</Pill> : <Pill>Built-in</Pill>}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{slot.where}</p>
                      {v?.updatedAt ? <p className="mt-0.5 text-xs text-slate-400">Changed {relativeTime(v.updatedAt)}</p> : null}
                    </div>
                    <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                      <Button size="sm" leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => setEditing(slot)}>
                        {v ? "Replace" : slot.optional ? "Add" : "Replace"}
                      </Button>
                      {v ? (
                        <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => reset(slot)}>
                          {slot.optional ? "Remove" : "Reset"}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))
      ) : (
        <Panel
          title="Library"
          description="Everything uploaded for the site. Pictures are stored small (WebP) to keep pages fast."
          actions={
            <UploadButton
              accept="image/*,video/mp4,video/webm"
              multiple
              label="Upload"
              onUploaded={(items) => {
                setLibrary((l) => [...items, ...(l || [])]);
                notify("success", `${items.length} file${items.length === 1 ? "" : "s"} uploaded.`);
              }}
              onError={(m) => notify("error", m)}
            />
          }
        >
          {library.length === 0 ? (
            <EmptyHint icon={<ImagePlus className="h-5 w-5" />} title="Nothing uploaded yet">
              Upload pictures here, or straight from a spot on the “On the site” tab.
            </EmptyHint>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {library.map((i) => {
                const uses = usedBy[i.id] || usedBy[i.url] || [];
                return (
                  <li key={i.id} className="overflow-hidden rounded-2xl border border-line bg-white dark:border-line-dark dark:bg-slate-900">
                    <Thumb url={i.smUrl || i.url} kind={i.kind} aspect={4 / 3} alt={i.name} className="rounded-none" />
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={i.name}>{i.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(i.size)}
                        {i.width ? ` · ${i.width}×${i.height}` : ""}
                      </p>
                      {uses.length ? <p className="truncate text-xs font-semibold text-teal-700 dark:text-teal-300">Used: {uses.join(", ")}</p> : null}
                      <div className="flex gap-1 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(i.url);
                              notify("success", "Link copied.");
                            } catch {
                              notify("error", "Couldn't copy the link.");
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden /> Link
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          aria-label={`Delete ${i.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <SlotDialog
        slot={editing}
        value={editing ? slots?.[editing.id] : undefined}
        library={library || []}
        onClose={() => setEditing(null)}
        onLibraryChange={(items) => setLibrary((l) => [...items, ...(l || [])])}
        onSaved={load}
      />
    </AdminPage>
  );
};

export default MediaPage;
