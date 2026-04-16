import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  FolderOpen,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import {
  CourseDoc,
  PathDoc,
  ResourceDoc,
  registrationStore,
} from "../services/registrationStore";

interface AdminResourcesPanelProps {
  paths: PathDoc[];
  courses: CourseDoc[];
  resources: ResourceDoc[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

type ResourceForm = {
  name: string;
  type: string;
  size: string;
  folder: string;
  url: string;
  description: string;
  pathId: string;
  courseId: string;
  isPublished: boolean;
};

const emptyForm: ResourceForm = {
  name: "",
  type: "PDF",
  size: "",
  folder: "General",
  url: "",
  description: "",
  pathId: "",
  courseId: "",
  isPublished: true,
};

const typeIcon = (type: string) => {
  const key = String(type || "").toLowerCase();
  if (key === "video") return Video;
  if (key === "code") return Code2;
  if (key === "link") return FileCode2;
  return FileText;
};

const AdminResourcesPanel: React.FC<AdminResourcesPanelProps> = ({
  paths,
  courses,
  resources,
  loading,
  onRefresh,
}) => {
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [editingResource, setEditingResource] = useState<ResourceDoc | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibleCourses = useMemo(() => {
    if (!form.pathId) return courses;
    return courses.filter(
      (course) => String(course.pathId || "").trim() === String(form.pathId).trim(),
    );
  }, [courses, form.pathId]);

  const folderGroups = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((resource) => {
      const folder = String(resource.folder || "General").trim() || "General";
      map.set(folder, (map.get(folder) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [resources]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingResource(null);
    setError("");
  };

  const startEdit = (resource: ResourceDoc) => {
    setEditingResource(resource);
    setForm({
      name: resource.name || "",
      type: resource.type || "PDF",
      size: resource.size || "",
      folder: resource.folder || "General",
      url: resource.url || "",
      description: resource.description || "",
      pathId: String(resource.pathId || ""),
      courseId: String(resource.courseId || ""),
      isPublished: resource.isPublished !== false,
    });
    setError("");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const url = form.url.trim();

    if (name.length < 2) {
      setError("Resource name must be at least 2 characters.");
      return;
    }

    if (!url) {
      setError("Resource URL is required.");
      return;
    }

    const payload = {
      name,
      type: form.type,
      size: form.size.trim(),
      folder: form.folder.trim() || "General",
      url,
      description: form.description.trim(),
      pathId: form.pathId || undefined,
      courseId: form.courseId || undefined,
      isPublished: form.isPublished,
    };

    setBusyId(editingResource?.id || "create-resource");

    try {
      if (editingResource) {
        await registrationStore.updateResource(editingResource.id, payload);
      } else {
        await registrationStore.addResource(payload);
      }
      await onRefresh();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Could not save the resource.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (resource: ResourceDoc) => {
    if (!confirm(`Delete "${resource.name}"? This cannot be undone.`)) return;

    setBusyId(resource.id);
    setError("");

    try {
      await registrationStore.deleteResource(resource.id);
      await onRefresh();
      if (editingResource?.id === resource.id) {
        resetForm();
      }
    } catch (err: any) {
      setError(err?.message || "Could not delete the resource.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur-sm p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Course Resources
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Manage downloadable PDFs, code packs, video links, and resource folders for the app.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          Refresh Resources
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
                {editingResource ? "Edit Resource" : "Add Resource"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Keep folder names consistent so the mobile library stays easy to scan.
              </p>
            </div>

            {editingResource ? (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Resource Name
              </label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                placeholder="Week 1 starter files"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Type
              </label>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                {["PDF", "Video", "Code", "Link"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Folder
              </label>
              <input
                value={form.folder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, folder: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                placeholder="Week 2 - Widgets"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Size Label
              </label>
              <input
                value={form.size}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, size: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
                placeholder="4.2 MB"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Resource URL
            </label>
            <input
              value={form.url}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, url: event.target.value }))
              }
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              placeholder="https://drive.google.com/... or https://youtube.com/..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Path
              </label>
              <select
                value={form.pathId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    pathId: event.target.value,
                    courseId: "",
                  }))
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

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Course
              </label>
              <select
                value={form.courseId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, courseId: event.target.value }))
                }
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              >
                <option value="">All courses</option>
                {visibleCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={4}
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none"
              placeholder="Short context for learners before they open this resource..."
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
            {busyId === (editingResource?.id || "create-resource")
              ? editingResource
                ? "Saving resource..."
                : "Creating resource..."
              : editingResource
                ? "Save Resource"
                : "Add Resource"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Published
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {resources.filter((resource) => resource.isPublished !== false).length}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Folders
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {folderGroups.length}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Folder Overview
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Use folders to mirror the mobile library layout.
                </p>
              </div>
            </div>

            {folderGroups.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No folders yet. Your first resource will create one.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {folderGroups.map(([folder, count]) => (
                  <span
                    key={folder}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-600 dark:text-slate-200"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{folder}</span>
                    <span className="text-slate-400">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-300">
            Loading resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="p-6 rounded-[2rem] border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200">
            No resources have been added yet. Start with PDFs, code bundles, or session recordings.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resources.map((resource, index) => {
              const Icon = typeIcon(resource.type);
              const pathTitle = paths.find((path) => path.id === resource.pathId)?.title;
              const courseTitle = courses.find((course) => course.id === resource.courseId)?.title;

              return (
                <motion.div
                  key={resource.id}
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
                            {resource.name}
                          </p>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              resource.isPublished !== false
                                ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300"
                                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300"
                            }`}
                          >
                            {resource.isPublished !== false ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {resource.type} • {resource.size || "No size"} • {resource.folder || "General"}
                        </p>

                        {resource.description ? (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                            {resource.description}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {pathTitle ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{pathTitle}</span>
                            </span>
                          ) : null}
                          {courseTitle ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{courseTitle}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-700 dark:hover:text-teal-300 transition"
                        title="Open resource"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => startEdit(resource)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-700 dark:hover:text-teal-300 transition"
                        title="Edit resource"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(resource)}
                        disabled={busyId === resource.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 transition disabled:opacity-60"
                        title="Delete resource"
                      >
                        {busyId === resource.id ? (
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

export default AdminResourcesPanel;
