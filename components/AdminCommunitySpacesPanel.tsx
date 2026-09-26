import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  FolderKanban,
  MessageSquare,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  CommunitySpaceDoc,
  CohortDoc,
  PathDoc,
  registrationStore,
} from "../services/registrationStore";

interface AdminCommunitySpacesPanelProps {
  cohorts: CohortDoc[];
  paths: PathDoc[];
  spaces: CommunitySpaceDoc[];
  loading: boolean;
  error?: string;
  onRefresh: () => Promise<void>;
  onConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "danger" | "warning" | "info";
  }) => Promise<boolean>;
}

type SpaceForm = {
  title: string;
  description: string;
  cohortId: string;
  pathId: string;
  roomUrl: string;
  ctaLabel: string;
  category: string;
  icon: string;
  sortOrder: string;
  isPublished: boolean;
};

const emptyForm: SpaceForm = {
  title: "",
  description: "",
  cohortId: "",
  pathId: "",
  roomUrl: "",
  ctaLabel: "Open space",
  category: "Discussion",
  icon: "forum",
  sortOrder: "0",
  isPublished: true,
};

const iconLabel = (icon: string) => {
  const key = String(icon || "").toLowerCase();
  if (key === "sparkles") return Sparkles;
  if (key === "book") return BookOpen;
  if (key === "folder") return FolderKanban;
  return MessageSquare;
};

const getCohortScopeValue = (cohort: CohortDoc) =>
  String((cohort as any)?.cohortId || cohort.id || "").trim();

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
    {children}
  </label>
);

const AdminCommunitySpacesPanel: React.FC<AdminCommunitySpacesPanelProps> = ({
  cohorts,
  paths,
  spaces,
  loading,
  error: loadError = "",
  onRefresh,
  onConfirm,
}) => {
  const [form, setForm] = useState<SpaceForm>(emptyForm);
  const [editingSpace, setEditingSpace] = useState<CommunitySpaceDoc | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const publishedCount = useMemo(
    () => spaces.filter((space) => space.isPublished !== false).length,
    [spaces],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingSpace(null);
    setError("");
  };

  const startEdit = (space: CommunitySpaceDoc) => {
    const matchedCohort = cohorts.find(
      (cohort) =>
        cohort.id === String(space.cohortId || "").trim() ||
        getCohortScopeValue(cohort) === String(space.cohortId || "").trim(),
    );
    setEditingSpace(space);
    setForm({
      title: space.title || "",
      description: space.description || "",
      cohortId: matchedCohort ? getCohortScopeValue(matchedCohort) : String(space.cohortId || ""),
      pathId: String(space.pathId || ""),
      roomUrl: space.roomUrl || "",
      ctaLabel: space.ctaLabel || "Open space",
      category: space.category || "Discussion",
      icon: space.icon || "forum",
      sortOrder: String(space.sortOrder ?? 0),
      isPublished: space.isPublished !== false,
    });
    setError("");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 2) {
      setError("Space title must be at least 2 characters.");
      return;
    }
    if (description.length < 8) {
      setError("Space description must be at least 8 characters.");
      return;
    }

    const selectedCohort = cohorts.find(
      (cohort) => getCohortScopeValue(cohort) === form.cohortId,
    );
    const payload = {
      title,
      description,
      cohortId:
        selectedCohort ? getCohortScopeValue(selectedCohort) : form.cohortId || undefined,
      cohortLabel: selectedCohort?.label || selectedCohort?.cohortKey || undefined,
      pathId: form.pathId || undefined,
      roomUrl: form.roomUrl.trim() || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      category: form.category.trim() || "Discussion",
      icon: form.icon.trim() || "forum",
      sortOrder: Number(form.sortOrder) || 0,
      isPublished: form.isPublished,
    };

    setBusyId(editingSpace?.id || "create-space");
    try {
      if (editingSpace) {
        await registrationStore.updateCommunitySpace(editingSpace.id, payload);
      } else {
        await registrationStore.addCommunitySpace(payload);
      }
      await onRefresh();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Could not save the community space.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (space: CommunitySpaceDoc) => {
    const ok = await onConfirm({
      title: "Delete community space?",
      message: `Delete "${space.title}" from the student community list?`,
      confirmLabel: "Delete Space",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(space.id);
    try {
      await registrationStore.deleteCommunitySpace(space.id);
      await onRefresh();
      if (editingSpace?.id === space.id) resetForm();
    } catch (err: any) {
      setError(err?.message || "Could not delete the community space.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur-sm p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Student Spaces
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Publish cohort and path-specific community rooms that mobile students can open directly.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          Refresh Spaces
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <form
          onSubmit={handleSave}
          className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {editingSpace ? "Edit Space" : "Add Space"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Use spaces for cohort rooms, challenge groups, and community lounge links managed from the dashboard.
              </p>
            </div>

            {editingSpace ? (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="p-4 rounded-2xl border bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200 text-sm font-medium">
              {error}
            </div>
          ) : null}

          {!error && loadError ? (
            <div className="p-4 rounded-2xl border bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200 text-sm font-medium">
              {loadError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Space title</FieldLabel>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                placeholder="Space title"
                required
              />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                {["Discussion", "Announcements", "Challenge", "Networking"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={4}
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              placeholder="What this space is for"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Cohort scope</FieldLabel>
              <select
                value={form.cohortId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cohortId: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                <option value="">All cohorts</option>
                {cohorts.map((cohort) => (
                <option key={cohort.id} value={getCohortScopeValue(cohort)}>
                  {cohort.label || cohort.cohortKey || cohort.id}
                </option>
              ))}
            </select>
            </div>
            <div>
              <FieldLabel>Path scope</FieldLabel>
              <select
                value={form.pathId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pathId: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                <option value="">All paths</option>
                {paths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Icon</FieldLabel>
              <select
                value={form.icon}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, icon: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                <option value="forum">Forum</option>
                <option value="sparkles">Sparkles</option>
                <option value="book">Book</option>
                <option value="folder">Folder</option>
              </select>
            </div>
            <div>
              <FieldLabel>CTA label</FieldLabel>
              <input
                value={form.ctaLabel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                placeholder="CTA label"
              />
            </div>
            <div>
              <FieldLabel>Sort order</FieldLabel>
              <input
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: event.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                inputMode="numeric"
                placeholder="Sort order"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Room URL</FieldLabel>
            <input
              value={form.roomUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, roomUrl: event.target.value }))
              }
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              placeholder="https://chat.whatsapp.com/... or https://discord.gg/..."
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
              className="h-4 w-4"
            />
            Published and visible to learners
          </label>

          <button
            type="submit"
            disabled={busyId !== null}
            className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg transition-all"
          >
            {busyId === (editingSpace?.id || "create-space")
              ? editingSpace
                ? "Saving space..."
                : "Creating space..."
              : editingSpace
                ? "Save Space"
                : "Add Space"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Published
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {publishedCount}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Spaces
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {spaces.length}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Publishing Notes
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Choose a cohort to make a space feel targeted instead of global.</li>
              <li>Add a room URL when the space should open WhatsApp, Discord, Telegram, or another live community.</li>
              <li>Use path targeting when only one learning track should see the room.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-300">
            Loading spaces...
          </div>
        ) : spaces.length === 0 ? (
          <div className="p-6 rounded-[2rem] border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200">
            No student spaces have been published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {spaces.map((space, index) => {
              const Icon = iconLabel(space.icon || "forum");
              const cohortLabel = cohorts.find((item) => item.id === space.cohortId)?.label;
              const pathTitle = paths.find((item) => item.id === space.pathId)?.title;

              return (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-700 dark:text-teal-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {space.title}
                          </p>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              space.isPublished !== false
                                ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300"
                                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300"
                            }`}
                          >
                            {space.isPublished !== false ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {space.category || "Discussion"} • Sort {space.sortOrder ?? 0}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                          {space.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cohortLabel ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                              <Users className="w-3.5 h-3.5" />
                              <span>{cohortLabel}</span>
                            </span>
                          ) : null}
                          {pathTitle ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{pathTitle}</span>
                            </span>
                          ) : null}
                          {space.roomUrl ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{space.ctaLabel || "Open space"}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {space.roomUrl ? (
                        <a
                          href={space.roomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-700 dark:hover:text-teal-300 transition"
                          title="Open space"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(space)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-700 dark:hover:text-teal-300 transition"
                        title="Edit space"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(space)}
                        disabled={busyId === space.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 transition disabled:opacity-60"
                        title="Delete space"
                      >
                        {busyId === space.id ? (
                          <span className="block h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommunitySpacesPanel;
