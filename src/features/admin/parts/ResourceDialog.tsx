/* Add or edit a resource: upload a file or paste a link, then choose who
   sees it (a course, a week, or one class). */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Paperclip, Upload, X } from "lucide-react";
import { registrationStore, type ResourceDoc } from "../../../../services/registrationStore";
import { uploadResourceFile } from "../../../../services/storage";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog, Segmented, Toggle } from "../ui";

export const RESOURCE_TYPES = ["PDF", "Slides", "Video", "Code", "Link", "Image", "Document"];

const typeFromFile = (f: File) => {
  if (f.type === "application/pdf") return "PDF";
  if (f.type.startsWith("image/")) return "Image";
  if (f.type.startsWith("video/")) return "Video";
  if (/presentation|powerpoint|keynote/.test(f.type) || /\.(pptx?|key)$/i.test(f.name)) return "Slides";
  if (/zip|json|javascript|typescript|x-dart|text\/x/.test(f.type) || /\.(zip|dart|js|ts|tsx|json|html|css)$/i.test(f.name)) return "Code";
  return "Document";
};
const sizeLabel = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

type Form = {
  name: string;
  type: string;
  url: string;
  size: string;
  folder: string;
  description: string;
  pathId: string;
  sessionWeek: string;
  sessionId: string;
  isPublished: boolean;
};

export type ResourcePreset = Partial<Pick<Form, "pathId" | "sessionId" | "sessionWeek" | "folder">>;

export const ResourceDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  resource?: ResourceDoc | null;
  preset?: ResourcePreset;
  onSaved?: () => void;
}> = ({ open, onClose, resource, preset, onSaved }) => {
  const { paths, resources, sessions: currentSessions, selectedCohortId, cohorts, activeByPath, fetchResources, notify } = useAdmin();
  const [classCohort, setClassCohort] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [f, setF] = useState<Form>({ name: "", type: "PDF", url: "", size: "", folder: "General", description: "", pathId: "", sessionWeek: "", sessionId: "", isPublished: true });
  const [source, setSource] = useState<"upload" | "link">("upload");
  const [upload, setUpload] = useState<{ name: string; pct: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const r: any = resource || {};
    setF({
      name: r.name || "",
      type: r.type || "PDF",
      url: r.url || "",
      size: r.size || "",
      folder: r.folder || preset?.folder || "General",
      description: r.description || "",
      pathId: String(r.pathId || preset?.pathId || ""),
      sessionWeek: r.sessionWeek != null ? String(r.sessionWeek) : preset?.sessionWeek || "",
      sessionId: String(r.sessionId || preset?.sessionId || ""),
      isPublished: r.isPublished !== false,
    });
    setSource(r.url && !/firebasestorage\.googleapis\.com/.test(r.url) ? "link" : "upload");
    const pid = String(r.pathId || preset?.pathId || "");
    // Classes come from one cohort: the one open for this course, else the one selected in admin.
    setClassCohort(String((pid && activeByPath?.[pid]?.cohortKey) || selectedCohortId || cohorts[0]?.id || ""));
    setError("");
    setUpload(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resource?.id]);

  useEffect(() => {
    let live = true;
    if (!open || !classCohort) return;
    if (classCohort === selectedCohortId && currentSessions.length) {
      setSessions(currentSessions as any[]);
      return;
    }
    registrationStore
      .getCohortSessions(classCohort)
      .then((list: any[]) => live && setSessions(list))
      .catch(() => live && setSessions([]));
    return () => {
      live = false;
    };
  }, [open, classCohort, selectedCohortId, currentSessions]);

  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));
  const folders = useMemo(() => [...new Set(["General", ...resources.map((r: any) => String(r.folder || "General"))])].sort(), [resources]);
  const classOptions = useMemo(
    () =>
      [...sessions]
        .filter((s: any) => !f.pathId || !s.pathId || s.pathId === f.pathId)
        .sort((a: any, b: any) => Number(a.week) - Number(b.week)),
    [sessions, f.pathId],
  );

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("Files must be under 50 MB. For videos, upload to YouTube (unlisted) and paste the link.");
      return;
    }
    setError("");
    setUpload({ name: file.name, pct: 0 });
    try {
      const up = await uploadResourceFile(file, (pct) => setUpload({ name: file.name, pct }));
      setF((p) => ({
        ...p,
        url: up.url,
        size: sizeLabel(file.size),
        type: typeFromFile(file),
        name: p.name || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
      }));
    } catch (err: any) {
      setError(err?.message || "Upload failed. Try again.");
    } finally {
      setUpload(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim();
    const url = f.url.trim();
    if (name.length < 2) return setError("Give the resource a name.");
    if (!/^(https?:\/\/|blob:)/i.test(url)) return setError(source === "upload" ? "Upload a file first." : "Paste the full link, starting with https://");
    const chosenClass: any = sessions.find((s: any) => s.id === f.sessionId);
    // Empty strings (not undefined) so editing can clear a course, week or class.
    const payload: any = {
      name,
      type: f.type,
      url,
      size: f.size.trim(),
      folder: f.folder.trim() || "General",
      description: f.description.trim(),
      pathId: f.pathId,
      courseId: "",
      sessionId: f.sessionId,
      sessionWeek: f.sessionId && chosenClass ? Number(chosenClass.week) : f.sessionWeek ? Number(f.sessionWeek) : null,
      isPublished: f.isPublished,
    };
    setSaving(true);
    setError("");
    try {
      if (resource) await registrationStore.updateResource(resource.id, payload);
      else
        await registrationStore.addResource({
          ...payload,
          pathId: payload.pathId || undefined,
          courseId: undefined,
          sessionId: payload.sessionId || undefined,
          sessionWeek: payload.sessionWeek ?? undefined,
          description: payload.description || undefined,
        });
      await fetchResources();
      notify("success", f.isPublished ? `${name} is live for students.` : `${name} saved as hidden.`);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save the resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={resource ? "Edit resource" : "Add a resource"}
      description="Slides, starter code, PDFs or links for students."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="resource-form" loading={saving} disabled={!!upload}>Save</Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={save} className="space-y-5">
        <div>
          <Segmented
            label="Resource source"
            value={source}
            onChange={(v) => setSource(v as "upload" | "link")}
            options={[
              { value: "upload", label: "Upload a file" },
              { value: "link", label: "Paste a link" },
            ]}
          />
          <div className="mt-3">
            {source === "upload" ? (
              <div className="rounded-2xl border border-dashed border-line-strong p-4 dark:border-slate-600">
                <input ref={fileInput} type="file" className="sr-only" id="resource-file" onChange={(e) => pick(e.target.files?.[0])} />
                {f.url && /firebasestorage\.googleapis\.com|^blob:/.test(f.url) && !upload ? (
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-5 w-5 text-teal-600" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      File uploaded{f.size ? ` · ${f.size}` : ""}
                    </span>
                    <button type="button" onClick={() => fileInput.current?.click()} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">
                      Replace
                    </button>
                    <button type="button" aria-label="Remove file" onClick={() => set({ url: "", size: "" })} className="text-slate-400 hover:text-red-600">
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : upload ? (
                  <div>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-300">Uploading {upload.name}…</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${upload.pct}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInput.current?.click()}>
                      Choose a file
                    </Button>
                    <span className="text-xs text-slate-500">PDF, slides, images, zip of starter code… up to 50 MB.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  aria-label="Link"
                  type="url"
                  value={f.url}
                  onChange={(e) => set({ url: e.target.value })}
                  placeholder="https://docs.google.com/… or https://github.com/…"
                  className={cn(inputClass, "pl-10")}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field label="Name" htmlFor="res-name">
            <input id="res-name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="e.g. Week 3 slides" />
          </Field>
          <Field label="Type" htmlFor="res-type">
            <select id="res-type" value={f.type} onChange={(e) => set({ type: e.target.value })} className={inputClass}>
              {[...new Set([...RESOURCE_TYPES, f.type])].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Short description (optional)" htmlFor="res-desc">
          <input id="res-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>

        <section className="space-y-4 rounded-2xl border border-line bg-paper p-4 dark:border-line-dark dark:bg-slate-800/40">
          <p className="text-sm font-bold text-blue-900 dark:text-white">Who sees it</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course" htmlFor="res-path">
              <select
                id="res-path"
                value={f.pathId}
                onChange={(e) => {
                  set({ pathId: e.target.value, sessionId: "" });
                  const key = activeByPath?.[e.target.value]?.cohortKey;
                  if (key) setClassCohort(String(key));
                }}
                className={inputClass}
              >
                <option value="">Every course</option>
                {paths.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Folder" htmlFor="res-folder" hint="Groups resources, e.g. “Week 1” or “References”.">
              <input id="res-folder" list="res-folders" value={f.folder} onChange={(e) => set({ folder: e.target.value })} className={inputClass} />
              <datalist id="res-folders">
                {folders.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <Field label="Classes from" htmlFor="res-cohort-pick">
              <select id="res-cohort-pick" value={classCohort} onChange={(e) => { setClassCohort(e.target.value); set({ sessionId: "" }); }} className={inputClass}>
                {cohorts
                  .filter((c: any) => !f.pathId || !c.pathId || c.pathId === f.pathId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
              </select>
            </Field>
            <Field label="Class (optional)" htmlFor="res-class" hint="Shows on that class's page.">
              <select id="res-class" value={f.sessionId} onChange={(e) => set({ sessionId: e.target.value })} className={inputClass}>
                <option value="">Not tied to one class</option>
                {f.sessionId && !classOptions.some((s: any) => s.id === f.sessionId) ? <option value={f.sessionId}>A class in another cohort</option> : null}
                {classOptions.map((s: any) => (
                  <option key={s.id} value={s.id}>Week {s.week}: {s.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Week (optional)" htmlFor="res-week" hint="Shows with every class that week.">
              <input
                id="res-week"
                type="number"
                min={1}
                max={52}
                value={f.sessionId ? (sessions.find((s: any) => s.id === f.sessionId) as any)?.week ?? f.sessionWeek : f.sessionWeek}
                disabled={!!f.sessionId}
                onChange={(e) => set({ sessionWeek: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <Toggle checked={f.isPublished} onChange={(v) => set({ isPublished: v })} label="Visible to students" description="Turn off to keep it hidden while you prepare it." />
        {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};
