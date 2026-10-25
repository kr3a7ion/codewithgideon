/* Community: group chats and rooms students can join, for everyone, one
   course, or one intake only. */
import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, MessagesSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { registrationStore, type CommunitySpaceDoc } from "../../../../services/registrationStore";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { AdminPage, Dialog, EmptyHint, IconButton, OverflowMenu, Panel, Pill, Segmented, Spinner, Toggle } from "../ui";

type Scope = "all" | "course" | "intake";
const CATEGORIES = ["Group chat", "Study room", "Announcements", "Help desk", "General"];

const scopeOf = (s: any): Scope => (s.cohortKey ? "intake" : s.pathId || s.cohortId ? "course" : "all");

const SpaceDialog: React.FC<{ space: CommunitySpaceDoc | null | "new"; nextOrder: number; onClose: () => void }> = ({ space, nextOrder, onClose }) => {
  const { paths, cohorts, activeByPath, fetchCommunitySpaces, notify } = useAdmin();
  const editing = space && space !== "new" ? (space as any) : null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Join");
  const [category, setCategory] = useState("Group chat");
  const [scope, setScope] = useState<Scope>("all");
  const [pathId, setPathId] = useState("");
  const [cohortKey, setCohortKey] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!space) return;
    const s: any = editing || {};
    setTitle(s.title || "");
    setDescription(s.description || "");
    setRoomUrl(s.roomUrl || "");
    setCtaLabel(s.ctaLabel || "Join");
    setCategory(s.category || "Group chat");
    const sc = editing ? scopeOf(s) : "intake";
    setScope(sc);
    // Old spaces stored only cohortId (shared by every intake of a course).
    const legacyPath = s.pathId || cohorts.find((c: any) => c.cohortId && c.cohortId === s.cohortId)?.pathId || "";
    const firstPath = paths[0]?.id || "";
    setPathId(String(legacyPath || firstPath));
    setCohortKey(String(s.cohortKey || activeByPath?.[legacyPath || firstPath]?.cohortKey || ""));
    setPublished(s.isPublished !== false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space]);

  if (!space) return null;
  const intakes = cohorts.filter((c: any) => !pathId || c.pathId === pathId);
  const chosen: any = cohorts.find((c) => c.id === cohortKey);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return setError("Give the space a name.");
    if (description.trim().length < 8) return setError("Add a short description (at least 8 characters).");
    if (roomUrl.trim() && !/^https?:\/\//i.test(roomUrl.trim())) return setError("The link must start with https://");
    if (scope !== "all" && !pathId) return setError("Choose a course.");
    if (scope === "intake" && !chosen) return setError("Choose an intake.");
    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      roomUrl: roomUrl.trim(),
      ctaLabel: ctaLabel.trim() || "Join",
      category,
      icon: "forum",
      isPublished: published,
      pathId: scope === "all" ? "" : pathId,
      cohortKey: scope === "intake" ? chosen.id : "",
      cohortId: scope === "intake" ? String(chosen.cohortId || "") : "",
      cohortLabel: scope === "intake" ? String(chosen.label || "") : "",
    };
    setSaving(true);
    setError("");
    try {
      if (editing) await registrationStore.updateCommunitySpace(editing.id, payload);
      else
        await registrationStore.addCommunitySpace({
          ...payload,
          sortOrder: nextOrder,
          pathId: payload.pathId || undefined,
          cohortKey: payload.cohortKey || undefined,
          cohortId: payload.cohortId || undefined,
          cohortLabel: payload.cohortLabel || undefined,
          roomUrl: payload.roomUrl || undefined,
        } as any);
      await fetchCommunitySpaces();
      notify("success", "Space saved.");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save the space.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? "Edit space" : "Add a space"}
      description="A WhatsApp group, Discord server or any room students can join."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="space-form" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="space-form" onSubmit={save} className="space-y-4">
        <Field label="Name" htmlFor="sp-title">
          <input id="sp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. September Flutter group" className={inputClass} data-autofocus />
        </Field>
        <Field label="What it's for" htmlFor="sp-desc">
          <textarea id="sp-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ask questions, share progress and get class updates." className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Invite link" htmlFor="sp-url">
            <input id="sp-url" type="url" value={roomUrl} onChange={(e) => setRoomUrl(e.target.value)} placeholder="https://chat.whatsapp.com/…" className={inputClass} />
          </Field>
          <Field label="Button text" htmlFor="sp-cta">
            <input id="sp-cta" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={24} className={inputClass} />
          </Field>
        </div>
        <Field label="Kind" htmlFor="sp-cat">
          <select id="sp-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {[...new Set([...CATEGORIES, category])].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <section className="space-y-3 rounded-2xl border border-line bg-paper p-4 dark:border-line-dark dark:bg-slate-800/40">
          <p className="text-sm font-bold text-blue-900 dark:text-white">Who can see it</p>
          <Segmented
            label="Who can see it"
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            options={[
              { value: "intake", label: "One intake" },
              { value: "course", label: "Course" },
              { value: "all", label: "Everyone" },
            ]}
          />
          {scope !== "all" ? (
            <Field label="Course" htmlFor="sp-path">
              <select
                id="sp-path"
                value={pathId}
                onChange={(e) => {
                  setPathId(e.target.value);
                  setCohortKey(String(activeByPath?.[e.target.value]?.cohortKey || ""));
                }}
                className={inputClass}
              >
                {paths.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {scope === "intake" ? (
            <Field label="Intake" htmlFor="sp-intake" hint="Only students in this intake see it. Later intakes won't.">
              <select id="sp-intake" value={cohortKey} onChange={(e) => setCohortKey(e.target.value)} className={inputClass}>
                <option value="">Choose an intake</option>
                {intakes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {activeByPath?.[pathId]?.cohortKey === c.id ? " (open)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </section>
        <Toggle checked={published} onChange={setPublished} label="Visible to students" />
        {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
      </form>
    </Dialog>
  );
};

const CommunityPage: React.FC = () => {
  const { communitySpaces, communitySpacesLoading, communitySpacesError, fetchCommunitySpaces, pathsById, cohorts, confirmAction, notify } = useAdmin();
  const [editing, setEditing] = useState<CommunitySpaceDoc | null | "new">(null);
  const list = useMemo(() => [...communitySpaces].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [communitySpaces]);

  const whoSees = (s: any) => {
    const sc = scopeOf(s);
    if (sc === "intake") return cohorts.find((c) => c.id === s.cohortKey)?.label || s.cohortLabel || s.cohortKey;
    if (sc === "course") {
      const p = s.pathId ? pathsById.get(s.pathId)?.title : cohorts.find((c: any) => c.cohortId === s.cohortId)?.path;
      return `${p || "One course"}${!s.pathId && s.cohortId ? " (every intake: old setting)" : ""}`;
    }
    return "Everyone";
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await Promise.all(next.map((s, k) => (Number(s.sortOrder) !== k ? registrationStore.updateCommunitySpace(s.id, { sortOrder: k }) : null)));
      await fetchCommunitySpaces();
    } catch (err: any) {
      notify("error", err?.message || "Couldn't reorder.");
    }
  };

  const toggle = async (s: CommunitySpaceDoc) => {
    await registrationStore.updateCommunitySpace(s.id, { isPublished: s.isPublished === false });
    await fetchCommunitySpaces();
  };

  const remove = async (s: CommunitySpaceDoc) => {
    const ok = await confirmAction({ title: `Delete ${s.title}?`, message: "Students will no longer see this space.", confirmLabel: "Delete", tone: "danger" });
    if (!ok) return;
    await registrationStore.deleteCommunitySpace(s.id);
    await fetchCommunitySpaces();
    notify("success", "Space deleted.");
  };

  return (
    <AdminPage
      title="Community"
      description="Group chats and rooms students can join. Give each intake its own group so later intakes don't see old ones."
      actions={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add space</Button>}
    >
      {communitySpacesError ? <p className="text-sm font-semibold text-red-600">{communitySpacesError}</p> : null}
      <Panel padded={false}>
        {communitySpacesLoading && list.length === 0 ? (
          <Spinner label="Loading spaces" />
        ) : list.length === 0 ? (
          <EmptyHint icon={<MessagesSquare className="h-5 w-5" />} title="No spaces yet" action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add a space</Button>}>
            Add your cohort&rsquo;s WhatsApp group so students can join it from their dashboard.
          </EmptyHint>
        ) : (
          <ul className="divide-y divide-line dark:divide-line-dark">
            {list.map((s: any, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950">
                  <MessagesSquare className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {s.title}
                    {s.isPublished === false ? <Pill>Hidden</Pill> : null}
                    {!s.roomUrl ? <Pill tone="orange">No link</Pill> : null}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {s.category || "General"} · Seen by: {whoSees(s)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-28">
                    <Toggle checked={s.isPublished !== false} onChange={() => toggle(s)} label="Visible" />
                  </div>
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </IconButton>
                  <IconButton label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </IconButton>
                  <IconButton label={`Edit ${s.title}`} onClick={() => setEditing(s)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </IconButton>
                  <OverflowMenu
                    items={[
                      ...(s.roomUrl ? [{ label: "Open link", icon: <ExternalLink className="h-4 w-4" />, onSelect: () => window.open(s.roomUrl, "_blank", "noopener") }] : []),
                      { label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => remove(s) },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <SpaceDialog space={editing} nextOrder={list.length} onClose={() => setEditing(null)} />
    </AdminPage>
  );
};

export default CommunityPage;
