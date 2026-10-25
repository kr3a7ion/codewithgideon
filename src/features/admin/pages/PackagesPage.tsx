/* Packages: what's on the Hire page (websites, apps and systems) and what it
   costs. Changes show on the site straight away. */
import React, { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { catalog } from "../../../../services/catalog";
import { PACKAGE_STARTERS, packagePrice, type HirePackage, type PackageNeed, type PriceMode } from "../../../marketing/catalog";
import { refreshCatalog } from "../../../marketing/useCatalog";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { AdminPage, Dialog, EmptyHint, IconButton, OverflowMenu, Panel, Pill, Segmented, Spinner, Toggle } from "../ui";

const NEEDS: { value: PackageNeed; label: string }[] = [
  { value: "landing", label: "Landing page" },
  { value: "booking", label: "Booking site" },
  { value: "mobile-app", label: "Mobile app" },
  { value: "web-app", label: "Web app / system" },
  { value: "other", label: "Something else" },
];

const blank = (order: number): HirePackage => ({
  id: "",
  track: "website",
  name: "",
  description: "",
  price: 0,
  priceMode: "fixed",
  priceNote: "one-off",
  timeline: "",
  includes: [],
  featured: false,
  badge: "",
  cta: "Get started",
  need: "other",
  published: true,
  order,
});

export const linesToList = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

const PackageDialog: React.FC<{
  pkg: HirePackage | null;
  existingIds: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ pkg, existingIds, onClose, onSaved }) => {
  const { notify } = useAdmin();
  const [f, setF] = useState<HirePackage>(blank(1));
  const [includes, setIncludes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pkg) return;
    setF(pkg);
    setIncludes(pkg.includes.join("\n"));
    setError("");
  }, [pkg]);

  if (!pkg) return null;
  const set = (patch: Partial<HirePackage>) => setF((p) => ({ ...p, ...patch }));
  const isNew = !pkg.id;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim();
    if (name.length < 2) return setError("Give the package a name.");
    if (f.priceMode !== "quote" && !(f.price > 0)) return setError("Enter a price, or choose “Custom quote”.");
    let id = f.id || catalog.slugify(name);
    if (isNew) {
      let n = 2;
      const base = id;
      while (existingIds.includes(id)) id = `${base}-${n++}`;
    }
    setSaving(true);
    setError("");
    try {
      await catalog.savePackage({
        ...f,
        id,
        name,
        description: f.description.trim(),
        price: f.priceMode === "quote" ? 0 : Math.round(f.price),
        includes: linesToList(includes).slice(0, 12),
      });
      await refreshCatalog();
      notify("success", `${name} saved. It's live on the Hire page.`);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save the package.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? "Add a package" : "Edit package"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="pkg-form" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="pkg-form" onSubmit={save} className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Shown under</p>
          <Segmented
            label="Package group"
            value={f.track}
            onChange={(v) => set({ track: v as HirePackage["track"] })}
            options={[
              { value: "website", label: "Websites" },
              { value: "app", label: "Apps & systems" },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="pkg-name">
            <input id="pkg-name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} data-autofocus />
          </Field>
          <Field label="Badge (optional)" htmlFor="pkg-badge" hint="e.g. “Most popular”.">
            <input id="pkg-badge" value={f.badge} onChange={(e) => set({ badge: e.target.value })} maxLength={40} className={inputClass} />
          </Field>
        </div>
        <Field label="Short description" htmlFor="pkg-desc">
          <textarea id="pkg-desc" rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>

        <section className="space-y-4 rounded-2xl border border-line bg-paper p-4 dark:border-line-dark dark:bg-slate-800/40">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Price</p>
            <Segmented
              label="How the price shows"
              value={f.priceMode}
              onChange={(v) => set({ priceMode: v as PriceMode })}
              options={[
                { value: "fixed", label: "Fixed" },
                { value: "from", label: "From" },
                { value: "quote", label: "Custom quote" },
              ]}
            />
          </div>
          {f.priceMode !== "quote" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (₦)" htmlFor="pkg-price">
                <input
                  id="pkg-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  value={f.price || ""}
                  onChange={(e) => set({ price: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="After the price" htmlFor="pkg-note" hint="e.g. “one-off”, “per month”.">
                <input id="pkg-note" value={f.priceNote} onChange={(e) => set({ priceNote: e.target.value })} maxLength={30} className={inputClass} />
              </Field>
            </div>
          ) : null}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Shows as: <strong className="text-blue-900 dark:text-white">{packagePrice(f)}</strong>
            {f.priceMode !== "quote" && f.priceNote ? ` ${f.priceNote}` : ""}
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Timeline" htmlFor="pkg-time" hint="e.g. “10–14 days”. Leave empty to hide.">
            <input id="pkg-time" value={f.timeline} onChange={(e) => set({ timeline: e.target.value })} maxLength={40} className={inputClass} />
          </Field>
          <Field label="Button text" htmlFor="pkg-cta">
            <input id="pkg-cta" value={f.cta} onChange={(e) => set({ cta: e.target.value })} maxLength={40} className={inputClass} />
          </Field>
        </div>
        <Field label="What's included" htmlFor="pkg-inc" hint="One per line, up to 12.">
          <textarea id="pkg-inc" rows={4} value={includes} onChange={(e) => setIncludes(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Enquiry form choice" htmlFor="pkg-need" hint="What the form picks when someone taps the button.">
          <select id="pkg-need" value={f.need} onChange={(e) => set({ need: e.target.value as PackageNeed })} className={inputClass}>
            {NEEDS.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </Field>
        <div className="space-y-3 rounded-2xl border border-line p-4 dark:border-line-dark">
          <Toggle checked={f.published} onChange={(v) => set({ published: v })} label="Show on the site" description="Turn off to hide it without deleting." />
          <Toggle checked={f.featured} onChange={(v) => set({ featured: v })} label="Highlight" description="Orange border and button, for the one you recommend." />
        </div>
        {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

const PackagesPage: React.FC = () => {
  const { notify, confirmAction } = useAdmin();
  const [items, setItems] = useState<HirePackage[] | null>(null);
  const [editing, setEditing] = useState<HirePackage | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await catalog.listPackages());
    } catch (err: any) {
      notify("error", err?.message || "Couldn't load packages.");
      setItems([]);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const importStarters = async () => {
    setImporting(true);
    try {
      const n = await catalog.seedPackages();
      await Promise.all([load(), refreshCatalog()]);
      notify("success", n ? `Imported ${n} package${n === 1 ? "" : "s"}. You can edit them now.` : "Everything was already imported.");
    } catch (err: any) {
      notify("error", err?.message || "Couldn't import.");
    } finally {
      setImporting(false);
    }
  };

  const move = async (track: HirePackage["track"], id: string, dir: -1 | 1) => {
    const all = [...(items || [])];
    const list = all.filter((p) => p.track === track);
    const i = list.findIndex((p) => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const others = all.filter((p) => p.track !== track);
    const ordered = track === "website" ? [...list, ...others] : [...others, ...list];
    setItems(ordered.map((p, k) => ({ ...p, order: k + 1 })));
    await catalog.reorder("hirePackages", ordered);
    await refreshCatalog();
  };

  const togglePublished = async (p: HirePackage) => {
    await catalog.savePackage({ ...p, published: !p.published });
    await Promise.all([load(), refreshCatalog()]);
  };

  const remove = async (p: HirePackage) => {
    const ok = await confirmAction({
      title: `Delete ${p.name}?`,
      message: "It disappears from the Hire page. To hide it for now, turn off “Show on the site” instead.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    await catalog.removePackage(p.id);
    await Promise.all([load(), refreshCatalog()]);
    notify("success", "Package deleted.");
  };

  const empty = items !== null && items.length === 0;
  const shown = empty ? PACKAGE_STARTERS : items || [];

  return (
    <AdminPage
      title="Packages"
      description="What's on the Hire page and what it costs. Changes go live straight away."
      actions={
        !empty ? (
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing(blank((items?.length || 0) + 1))}>
            Add package
          </Button>
        ) : null
      }
    >
      {items === null ? (
        <Spinner label="Loading packages" />
      ) : (
        <>
          {empty ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-100 sm:flex-row sm:items-center sm:justify-between">
              <p>The Hire page is showing the built-in packages below. Import them to change prices and wording here.</p>
              <Button size="sm" leftIcon={<Download className="h-4 w-4" />} loading={importing} onClick={importStarters}>
                Import packages
              </Button>
            </div>
          ) : null}
          {(["website", "app"] as const).map((track) => {
            const list = shown.filter((p) => p.track === track);
            return (
              <Panel key={track} title={track === "website" ? "Websites" : "Apps and business systems"} padded={false}>
                {list.length === 0 ? (
                  <EmptyHint icon={<TagIcon className="h-5 w-5" />} title="No packages here yet" />
                ) : (
                  <ul className="divide-y divide-line dark:divide-line-dark">
                    {list.map((p, i) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-5">
                        <div className="min-w-0 flex-1 basis-48">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                            {p.name}
                            {p.featured ? <Pill tone="orange">Highlighted</Pill> : null}
                            {!p.published ? <Pill>Hidden</Pill> : null}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            <strong className="text-blue-900 dark:text-white">{packagePrice(p)}</strong>
                            {p.priceMode !== "quote" && p.priceNote ? ` ${p.priceNote}` : ""}
                            {p.timeline ? ` · ${p.timeline}` : ""}
                          </p>
                        </div>
                        {!empty ? (
                          <div className="flex items-center gap-1">
                            <div className="w-28">
                              <Toggle checked={p.published} onChange={() => togglePublished(p)} label="On site" />
                            </div>
                            <IconButton label="Move up" disabled={i === 0} onClick={() => move(track, p.id, -1)}>
                              <ArrowUp className="h-4 w-4" aria-hidden />
                            </IconButton>
                            <IconButton label="Move down" disabled={i === list.length - 1} onClick={() => move(track, p.id, 1)}>
                              <ArrowDown className="h-4 w-4" aria-hidden />
                            </IconButton>
                            <IconButton label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                              <Pencil className="h-4 w-4" aria-hidden />
                            </IconButton>
                            <OverflowMenu items={[{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => remove(p) }]} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </>
      )}
      <PackageDialog
        pkg={editing}
        existingIds={(items || []).map((p) => p.id)}
        onClose={() => setEditing(null)}
        onSaved={load}
      />
    </AdminPage>
  );
};

export default PackagesPage;
