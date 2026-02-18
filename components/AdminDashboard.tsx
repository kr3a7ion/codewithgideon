import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import {
  registrationStore,
  RegistrationEntry,
  CourseDoc,
  CohortDoc,
  SessionDoc,
} from "../services/registrationStore";

interface AdminDashboardProps {
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

type SyllabusWeek = {
  week: number; // 1..N
  title: string;
  topics: string[];
};

type CourseForm = {
  title: string;
  duration: string;
  sessions: string;
  level: string;
  description: string;
  priceLabel: string;
  imageUrl: string;
  syllabusView: string;
  isActive: boolean;

  weeks: number;
  pricePerWeek: number;
  syllabus: SyllabusWeek[];
};

const emptyCourse: CourseForm = {
  title: "",
  duration: "4 Weeks",
  sessions: "2× Weekly",
  level: "Beginner",
  description: "",
  priceLabel: "₦10k/wk",
  imageUrl: "",
  syllabusView: "",
  isActive: true,
  weeks: 4,
  pricePerWeek: 10000,
  syllabus: [{ week: 1, title: "Introduction", topics: ["Overview", "Setup"] }],
};

/**
 * ✅ UPDATED SessionForm:
 * - added week, path, isPublished
 */
type SessionForm = {
  title: string;
  week: number; // ✅ NEW
  path: string; // ✅ NEW
  isPublished: boolean; // ✅ NEW

  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMins: number;
  joinUrl: string;
  notes: string;
};

const emptySession: SessionForm = {
  title: "",
  week: 1,
  path: "",
  isPublished: true,

  date: "",
  time: "18:00",
  durationMins: 60,
  joinUrl: "",
  notes: "",
};

const toLocalDateInput = (ms: number) => {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toLocalTimeInput = (ms: number) => {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const combineDateTimeToMs = (date: string, time: string) => {
  const [yyyy, mm, dd] = date.split("-").map((x) => parseInt(x, 10));
  const [hh, min] = time.split(":").map((x) => parseInt(x, 10));
  if (!yyyy || !mm || !dd) return Date.now();
  const d = new Date(yyyy, mm - 1, dd, hh || 0, min || 0, 0, 0);
  return d.getTime();
};

/**
 * ✅ Timestamp-safe conversion:
 * - supports number, string, Firestore Timestamp
 */
const sessionTimeToMs = (t: any) => {
  if (!t) return Date.now();
  if (typeof t === "number") return t;
  if (typeof t === "string") {
    const n = Date.parse(t);
    return Number.isFinite(n) ? n : Date.now();
  }
  if (typeof t?.toMillis === "function") return t.toMillis(); // Firestore Timestamp
  return Date.now();
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onLogout,
}) => {
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Complete">("All");
  const [search, setSearch] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem("gs_webhook_url") || "",
  );

  // Courses
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDoc | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);
  const [courseError, setCourseError] = useState("");

  // Active cohort config
  const [activeCohortId, setActiveCohortId] = useState("");
  const [activeCohortLabel, setActiveCohortLabel] = useState("");
  const [cohortSaving, setCohortSaving] = useState(false);

  // Cohorts + sessions manager
  const [cohorts, setCohorts] = useState<CohortDoc[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [cohortIdInput, setCohortIdInput] = useState("");
  const [cohortLabelInput, setCohortLabelInput] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionDoc | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySession);
  const [sessionError, setSessionError] = useState("");

  /**
   * ✅ NEW: derive path options safely
   * - from registrations.path
   * - (optional) from courses.title
   */
  const pathOptions = useMemo(() => {
    const uniq = new Set<string>();
    registrations.forEach((r) => r.path && uniq.add(String(r.path)));
    courses.forEach((c) => c.title && uniq.add(String(c.title)));
    const arr = Array.from(uniq).sort();
    return arr.length ? arr : ["Flutter & Mobile App Development"];
  }, [registrations, courses]);

  // -------------------------
  // Helpers
  // -------------------------
  const parseWeeks = (text: string) => {
    const n = parseInt(String(text).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 4;
  };

  const parsePricePerWeek = (label: string) => {
    const lower = String(label).toLowerCase();
    const hasK = lower.includes("k");
    const num = parseInt(lower.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(num)) return 0;
    return hasK ? num * 1000 : num;
  };

  const formatPriceLabel = (pricePerWeek: number) => {
    if (!pricePerWeek) return "₦0/wk";
    if (pricePerWeek % 1000 === 0) return `₦${pricePerWeek / 1000}k/wk`;
    return `₦${pricePerWeek.toLocaleString()}/wk`;
  };

  const normalizeSyllabus = (syllabus: SyllabusWeek[], weeks: number) => {
    const clean = (syllabus || [])
      .filter(Boolean)
      .map((w, idx) => ({
        week: idx + 1,
        title: String(w?.title || "").trim(),
        topics: Array.isArray(w?.topics)
          ? w.topics.map((t) => String(t).trim()).filter(Boolean)
          : [],
      }))
      .filter((w) => w.title.length > 0 || w.topics.length > 0);

    return clean.slice(0, Math.max(1, weeks));
  };

  const closeCourseModal = () => {
    setCourseModalOpen(false);
    setEditingCourse(null);
    setCourseForm(emptyCourse);
    setCourseError("");
  };

  const closeSessionModal = () => {
    setSessionModalOpen(false);
    setEditingSession(null);
    setSessionForm(emptySession);
    setSessionError("");
  };

  // -------------------------
  // Data loaders
  // -------------------------
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await registrationStore.getAll();
      setRegistrations(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const list = await registrationStore.getCourses();
      setCourses(list || []);
    } catch (e) {
      console.error("Failed to load courses:", e);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchActiveCohort = async () => {
    try {
      const active = await registrationStore.getActiveCohort();
      setActiveCohortId(active.id);
      setActiveCohortLabel(active.label);
    } catch (e) {
      console.error("fetchActiveCohort failed:", e);
    }
  };

  const fetchCohorts = async () => {
    setCohortsLoading(true);
    try {
      const list = await registrationStore.getCohorts();
      setCohorts(list || []);
      if (!selectedCohortId && list?.length) setSelectedCohortId(list[0].id);
    } catch (e) {
      console.error("fetchCohorts failed:", e);
      setCohorts([]);
    } finally {
      setCohortsLoading(false);
    }
  };

  const fetchSessions = async (cohortId: string) => {
    if (!cohortId) return;
    setSessionsLoading(true);
    try {
      const list = await registrationStore.getCohortSessions(cohortId);
      setSessions(list || []);
    } catch (e) {
      console.error("fetchSessions failed:", e);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchCourses();
    fetchActiveCohort();
    fetchCohorts();
  }, []);

  useEffect(() => {
    if (selectedCohortId) fetchSessions(selectedCohortId);
  }, [selectedCohortId]);

  // -------------------------
  // Webhook
  // -------------------------
  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("gs_webhook_url", webhookUrl);
    setShowConfig(false);
  };

  const handleSyncToSheets = async () => {
    if (!webhookUrl) {
      alert("Please configure the Google Sheet Webhook URL first.");
      setShowConfig(true);
      return;
    }
    if (registrations.length === 0) return alert("No data to sync.");

    setIsSyncing(true);
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_registrations",
          data: registrations,
          timestamp: new Date().toISOString(),
        }),
      });

      alert(
        "Sync signal sent to Google Sheets! (no-cors means you won’t see a response)",
      );
    } catch (error) {
      console.error("Sync Error:", error);
      alert("Failed to connect to Google Sheets Webhook.");
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------
  // Registrations actions
  // -------------------------
  const handleToggleStatus = async (
    uid: string,
    current: "Pending" | "Complete",
  ) => {
    const next = current === "Pending" ? "Complete" : "Pending";
    await registrationStore.updateStatus(uid, next);
    await fetchRegistrations();
  };

  const handleDelete = async (uid: string) => {
    if (confirm("Are you sure you want to delete this registration?")) {
      await registrationStore.delete(uid);
      await fetchRegistrations();
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        "DANGER: This will permanently delete ALL registration records. Are you absolutely sure?",
      )
    ) {
      await registrationStore.clearAll();
      setRegistrations([]);
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) return alert("No data to export.");

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Path",
      "Age",
      "Gender",
      "Weeks",
      "Total Price",
      "Status",
      "Date",
    ];
    const rows = registrations.map((reg) => [
      `"${reg.fullName}"`,
      reg.email,
      reg.phone,
      `"${reg.path}"`,
      reg.ageRange,
      reg.gender,
      reg.weeksToCommit,
      reg.totalPrice,
      reg.status,
      new Date(reg.timestamp).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `CodeWithGideon_Registrations_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = registrations
    .filter((r) => filter === "All" || r.status === filter)
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.fullName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.path || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  // -------------------------
  // Stats + pending payments view
  // -------------------------
  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === "Pending").length;
    const complete = registrations.filter(
      (r) => r.status === "Complete",
    ).length;
    const revenue = registrations
      .filter((r) => r.status === "Complete")
      .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

    const pendingPayments = registrations.filter(
      (r) => !!(r as any).pendingPayment,
    );
    return {
      total,
      pending,
      complete,
      revenue,
      pendingPaymentsCount: pendingPayments.length,
    };
  }, [registrations]);

  const pendingPayments = useMemo(() => {
    return registrations
      .filter((r) => !!(r as any).pendingPayment)
      .sort(
        (a, b) =>
          ((b as any).pendingPayment?.createdAt ?? 0) -
          ((a as any).pendingPayment?.createdAt ?? 0),
      );
  }, [registrations]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      alert("Copy failed (browser permissions).");
    }
  };

  // -------------------------
  // Courses actions
  // -------------------------
  const openAddCourse = () => {
    setCourseError("");
    setEditingCourse(null);
    setCourseForm(emptyCourse);
    setCourseModalOpen(true);
  };

  const openEditCourse = (c: CourseDoc) => {
    setCourseError("");
    setEditingCourse(c);

    const inferredWeeks =
      (c as any).weeks && Number.isFinite((c as any).weeks)
        ? Number((c as any).weeks)
        : parseWeeks(c.duration || "4 Weeks");

    const inferredPricePerWeek =
      (c as any).pricePerWeek && Number.isFinite((c as any).pricePerWeek)
        ? Number((c as any).pricePerWeek)
        : parsePricePerWeek(c.priceLabel || "₦10k/wk") || 10000;

    const inferredSyllabus: SyllabusWeek[] = Array.isArray((c as any).syllabus)
      ? (c as any).syllabus
      : [{ week: 1, title: "Introduction", topics: ["Overview", "Setup"] }];

    setCourseForm({
      title: c.title || "",
      duration: c.duration || `${inferredWeeks} Weeks`,
      sessions: c.sessions || "2× Weekly",
      level: c.level || "Beginner",
      description: c.description || "",
      priceLabel: c.priceLabel || formatPriceLabel(inferredPricePerWeek),
      imageUrl: c.imageUrl || "",
      syllabusView: (c as any).syllabusView || "",
      isActive: (c as any).isActive !== false,

      weeks: inferredWeeks,
      pricePerWeek: inferredPricePerWeek,
      syllabus: normalizeSyllabus(inferredSyllabus, inferredWeeks),
    });

    setCourseModalOpen(true);
  };

  const addSyllabusWeek = () => {
    setCourseForm((p) => {
      const nextWeek = (p.syllabus?.length || 0) + 1;
      const next = [
        ...(p.syllabus || []),
        { week: nextWeek, title: `Week ${nextWeek}`, topics: [] },
      ];
      const nextWeeks = Math.max(p.weeks, nextWeek);
      return {
        ...p,
        syllabus: next,
        weeks: nextWeeks,
        duration: `${nextWeeks} Weeks`,
      };
    });
  };

  const removeSyllabusWeek = (weekIndex: number) => {
    setCourseForm((p) => {
      const next = (p.syllabus || []).filter((_, idx) => idx !== weekIndex);
      const relabeled = next.map((w, idx) => ({ ...w, week: idx + 1 }));
      const trimmed = normalizeSyllabus(relabeled, p.weeks);
      return { ...p, syllabus: trimmed };
    });
  };

  const updateSyllabusWeekTitle = (weekIndex: number, title: string) => {
    setCourseForm((p) => {
      const next = [...(p.syllabus || [])];
      next[weekIndex] = { ...next[weekIndex], title };
      return { ...p, syllabus: next };
    });
  };

  const updateSyllabusWeekTopics = (weekIndex: number, text: string) => {
    const topics = String(text)
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    setCourseForm((p) => {
      const next = [...(p.syllabus || [])];
      next[weekIndex] = { ...next[weekIndex], topics };
      return { ...p, syllabus: next };
    });
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError("");

    const title = courseForm.title.trim();
    const description = courseForm.description.trim();

    if (title.length < 3)
      return setCourseError("Title must be at least 3 characters.");
    if (description.length < 3)
      return setCourseError("Description must be at least 3 characters.");

    const weeks =
      Number.isFinite(courseForm.weeks) && courseForm.weeks > 0
        ? Math.floor(courseForm.weeks)
        : parseWeeks(courseForm.duration || "4 Weeks");
    const pricePerWeek =
      Number.isFinite(courseForm.pricePerWeek) && courseForm.pricePerWeek > 0
        ? Math.floor(courseForm.pricePerWeek)
        : parsePricePerWeek(courseForm.priceLabel || "₦10k/wk");

    if (!weeks || weeks < 1) return setCourseError("Weeks must be at least 1.");
    if (!pricePerWeek || pricePerWeek < 100)
      return setCourseError(
        'Invalid price. Use 10000 or label like "₦10k/wk".',
      );

    const payload: any = {
      title,
      duration: `${weeks} Weeks`,
      sessions: String(courseForm.sessions || "2× Weekly").trim(),
      level: String(courseForm.level || "Beginner").trim(),
      description,
      priceLabel: formatPriceLabel(pricePerWeek),
      imageUrl: String(courseForm.imageUrl || "").trim(),
      syllabusView: String(courseForm.syllabusView || "").trim(),
      isActive: courseForm.isActive ?? true,

      weeks,
      pricePerWeek,
      syllabus: normalizeSyllabus(courseForm.syllabus, weeks),
    };

    try {
      if (editingCourse)
        await registrationStore.updateCourse(editingCourse.id, payload);
      else await registrationStore.addCourse(payload);

      closeCourseModal();
      await fetchCourses();
    } catch (err: any) {
      console.error("Save course failed:", err);
      setCourseError(err?.message || "Failed to save course.");
    }
  };

  const deleteCourse = async (c: CourseDoc) => {
    if (
      !confirm(
        `Delete course "${c.title}"? This will remove it from the landing page.`,
      )
    )
      return;
    try {
      await registrationStore.deleteCourse(c.id);
      await fetchCourses();
    } catch (e) {
      console.error("Delete course failed:", e);
      alert("Failed to delete course.");
    }
  };

  const toggleCourseActive = async (c: CourseDoc) => {
    const current = (c as any).isActive !== false;
    try {
      await registrationStore.updateCourse(c.id, { isActive: !current } as any);
      await fetchCourses();
    } catch (e) {
      console.error("Toggle active failed:", e);
    }
  };

  // -------------------------
  // Active cohort save
  // -------------------------
  const saveActiveCohort = async () => {
    const id = activeCohortId.trim();
    const label = activeCohortLabel.trim();
    if (!id || !label) return alert("Cohort ID and Label are required.");

    setCohortSaving(true);
    try {
      await registrationStore.setActiveCohort(id, label);
      alert("Active cohort updated.");
      await fetchActiveCohort();
    } catch (e) {
      console.error("saveActiveCohort failed:", e);
      alert("Failed to update active cohort.");
    } finally {
      setCohortSaving(false);
    }
  };

  // -------------------------
  // Cohorts manager actions
  // -------------------------
  const addCohort = async () => {
    const id = cohortIdInput.trim();
    const label = cohortLabelInput.trim();
    if (!label) return alert("Cohort label is required.");

    try {
      const newId = await registrationStore.addCohort({
        id: id || undefined,
        label,
        isActive: true,
      });
      setCohortIdInput("");
      setCohortLabelInput("");
      await fetchCohorts();
      setSelectedCohortId(newId);
    } catch (e) {
      console.error("addCohort failed:", e);
      alert("Failed to add cohort.");
    }
  };

  const deleteCohort = async (c: CohortDoc) => {
    if (
      !confirm(
        `Delete cohort "${c.label}"? (Sessions under it will also be inaccessible)`,
      )
    )
      return;
    try {
      await registrationStore.deleteCohort(c.id);
      await fetchCohorts();
      if (selectedCohortId === c.id) {
        setSelectedCohortId("");
        setSessions([]);
      }
    } catch (e) {
      console.error("deleteCohort failed:", e);
      alert("Failed to delete cohort.");
    }
  };

  // -------------------------
  // Sessions manager actions (✅ upgraded)
  // -------------------------
  const openAddSession = () => {
    setSessionError("");
    setEditingSession(null);

    const defaultPath = pathOptions[0] || "Flutter & Mobile App Development";

    setSessionForm({
      ...emptySession,
      week: 1,
      path: defaultPath,
      isPublished: true,
      date: toLocalDateInput(Date.now()),
      time: "18:00",
    });

    setSessionModalOpen(true);
  };

  const openEditSession = (s: SessionDoc) => {
    setSessionError("");
    setEditingSession(s);

    const ms = sessionTimeToMs((s as any).startsAt);

    setSessionForm({
      title: s.title || "",
      week: Number((s as any).week || 1),
      path: String(
        (s as any).path || pathOptions[0] || "Flutter & Mobile App Development",
      ),
      isPublished: (s as any).isPublished !== false,

      date: toLocalDateInput(ms),
      time: toLocalTimeInput(ms),
      durationMins: Number((s as any).durationMins || 60),
      joinUrl: String((s as any).joinUrl || ""),
      notes: String((s as any).notes || ""),
    });

    setSessionModalOpen(true);
  };

  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError("");

    if (!selectedCohortId) return setSessionError("Select a cohort first.");

    const title = sessionForm.title.trim();
    if (title.length < 3)
      return setSessionError("Title must be at least 3 characters.");

    const week = Math.max(1, Math.floor(Number(sessionForm.week || 1)));
    const path = String(sessionForm.path || "").trim();
    if (!path) return setSessionError("Path is required.");

    const startsAt = combineDateTimeToMs(sessionForm.date, sessionForm.time);
    const durationMins = Math.max(
      15,
      Math.floor(Number(sessionForm.durationMins || 60)),
    );

    try {
      if (editingSession) {
        await registrationStore.updateCohortSession(
          selectedCohortId,
          editingSession.id,
          {
            title,
            week,
            path,
            isPublished: !!sessionForm.isPublished,
            startsAt,
            durationMins,
            joinUrl: sessionForm.joinUrl.trim(),
            notes: sessionForm.notes.trim(),
          } as any,
        );
      } else {
        await registrationStore.addCohortSession(selectedCohortId, {
          title,
          week,
          path,
          isPublished: !!sessionForm.isPublished,
          startsAt,
          durationMins,
          joinUrl: sessionForm.joinUrl.trim(),
          notes: sessionForm.notes.trim(),
        } as any);
      }

      closeSessionModal();
      await fetchSessions(selectedCohortId);
    } catch (e: any) {
      console.error("saveSession failed:", e);
      setSessionError(e?.message || "Failed to save session.");
    }
  };

  const deleteSession = async (s: SessionDoc) => {
    if (!selectedCohortId) return;
    if (!confirm(`Delete session "${s.title}"?`)) return;
    try {
      await registrationStore.deleteCohortSession(selectedCohortId, s.id);
      await fetchSessions(selectedCohortId);
    } catch (e) {
      console.error("deleteSession failed:", e);
      alert("Failed to delete session.");
    }
  };

  // -------------------------
  // Pending payment actions
  // -------------------------
  const clearPending = async (uid: string) => {
    if (!confirm("Clear pending payment for this user?")) return;
    try {
      await registrationStore.clearPendingPayment(uid);
      await fetchRegistrations();
    } catch (e) {
      console.error("clearPending failed:", e);
      alert("Failed to clear pending payment.");
    }
  };

  const approvePending = async (reg: RegistrationEntry) => {
    const pending = (reg as any).pendingPayment;
    if (!pending) return;

    const ok = confirm(
      `Approve ${pending.kind.toUpperCase()} payment?\n\nUser: ${reg.fullName}\nWeeks: ${pending.weeks}\nAmount: ₦${Number(pending.amount || 0).toLocaleString()}\nRef: ${pending.reference}`,
    );
    if (!ok) return;

    try {
      if (pending.kind === "topup") {
        await registrationStore.approveTopUpFromPending(reg.uid, pending);
      } else {
        await registrationStore.approveInitialPayment(
          reg.uid,
          pending.amount,
          pending.weeks,
          pending.reference,
        );
      }
      await fetchRegistrations();
    } catch (e) {
      console.error("approvePending failed:", e);
      alert("Failed to approve pending payment.");
    }
  };

  // -------------------------
  // RETURN JSX (unchanged except session modal + session list date line)
  // -------------------------
  return (
    <div className="py-12 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-blue-900 dark:text-white">
              Admin Control Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage cohorts, sessions, payments, and integrations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchRegistrations}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
            >
              Refresh
            </button>

            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                isSyncing
                  ? "bg-gray-200 text-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md"
              }`}
            >
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9a2 2 0 114 0 2 2 0 01-4 0zM9 21h6a2 2 0 002-2v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 002 2z"
                  />
                </svg>
              )}
              Sync to Sheets
            </button>

            <button
              onClick={() => setShowConfig(true)}
              className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
              title="Configure Sheet Binding"
              aria-label="Configure Sheet Binding"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 hidden md:block" />

            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total Students",
              value: stats.total,
              valueClass: "text-blue-900 dark:text-white",
            },
            {
              label: "Pending",
              value: stats.pending,
              valueClass: "text-orange-600",
            },
            {
              label: "Complete",
              value: stats.complete,
              valueClass: "text-teal-600",
            },
            {
              label: "Revenue (Complete)",
              value: `₦${stats.revenue.toLocaleString()}`,
              valueClass: "text-blue-900 dark:text-white",
            },
            {
              label: "Pending Payments",
              value: stats.pendingPaymentsCount,
              valueClass: "text-purple-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {s.label}
              </p>
              <p className={`text-2xl font-black mt-2 ${s.valueClass}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Active Cohort */}
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Active Cohort
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This cohort tag is attached to new student registrations.
              </p>
            </div>

            <button
              onClick={saveActiveCohort}
              disabled={
                cohortSaving ||
                !activeCohortId.trim() ||
                !activeCohortLabel.trim()
              }
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                cohortSaving
                  ? "bg-gray-200 text-gray-500"
                  : "bg-blue-900 text-white hover:opacity-90"
              }`}
            >
              {cohortSaving ? "Saving..." : "Save Active Cohort"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Cohort ID
              </label>
              <input
                value={activeCohortId}
                onChange={(e) => setActiveCohortId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. CWG-FEB-2026"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Cohort Label
              </label>
              <input
                value={activeCohortLabel}
                onChange={(e) => setActiveCohortLabel(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. February 2026 Cohort"
              />
            </div>
          </div>
        </div>

        {/* Cohorts + Sessions Manager */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohorts */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-blue-900 dark:text-white">
                  Cohorts
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create cohorts and manage session schedules.
                </p>
              </div>

              <button
                onClick={fetchCohorts}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                value={cohortIdInput}
                onChange={(e) => setCohortIdInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 outline-none"
                placeholder="Optional ID: CWG-FEB-2026"
              />
              <input
                value={cohortLabelInput}
                onChange={(e) => setCohortLabelInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 outline-none"
                placeholder="Label: February 2026 Cohort"
              />
            </div>

            <button
              onClick={addCohort}
              className="w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition mb-6"
            >
              + Add Cohort
            </button>

            {cohortsLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading cohorts…
              </div>
            ) : cohorts.length === 0 ? (
              <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
                No cohorts yet. Add one above.
              </div>
            ) : (
              <div className="space-y-3">
                {cohorts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCohortId(c.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      selectedCohortId === c.id
                        ? "border-blue-900 dark:border-teal-600 bg-blue-50 dark:bg-teal-900/20"
                        : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {c.label}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          ID: {c.id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCohort(c);
                        }}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-blue-900 dark:text-white">
                  Live Sessions
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedCohortId
                    ? `Cohort: ${selectedCohortId}`
                    : "Select a cohort to manage sessions."}
                </p>
              </div>

              <button
                onClick={openAddSession}
                disabled={!selectedCohortId}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !selectedCohortId
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-900 text-white hover:opacity-90"
                }`}
              >
                + Add Session
              </button>
            </div>

            {sessionsLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                No sessions yet. Add the first session.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          {new Date(
                            sessionTimeToMs((s as any).startsAt),
                          ).toLocaleString()}
                          {Number(s.durationMins || 60)} mins
                        </p>
                        {s.joinUrl ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">
                            Join: {s.joinUrl}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSession(s)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSession(s)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {s.notes ? (
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {s.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Payments Viewer */}
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Pending Payments
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Approve or clear pending Paystack references.
              </p>
            </div>

            <button
              onClick={fetchRegistrations}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
            >
              Refresh
            </button>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              No pending payments right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Student
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Kind
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Weeks
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Reference
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {pendingPayments.map((r) => {
                    const p = (r as any).pendingPayment;
                    return (
                      <tr
                        key={r.uid}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {r.fullName}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {r.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {p?.kind}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {p?.weeks}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-blue-900 dark:text-teal-500">
                          ₦{Number(p?.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold break-all">
                            {p?.reference}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(String(p?.reference || ""))
                            }
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 hover:underline"
                          >
                            Copy Ref
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approvePending(r)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:opacity-90 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => clearPending(r.uid)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-orange-600 text-white hover:opacity-90 transition"
                            >
                              Clear
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
              <button
                onClick={() => setShowConfig(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-blue-900 dark:hover:text-slate-200 transition"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">
                Sheet Binding Setup
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Connect your registrations directly to a Google Sheet.
              </p>

              <form onSubmit={handleSaveWebhook} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Google Apps Script URL
                  </label>
                  <input
                    required
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition"
                >
                  Save Configuration
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Course Catalog */}
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Course Catalog
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add / edit courses shown on the landing page “Courses” section.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchCourses}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
              >
                Refresh Courses
              </button>

              <button
                onClick={openAddCourse}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
              >
                + Add Course
              </button>
            </div>
          </div>

          {coursesLoading ? (
            <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
              No courses found yet. Click <b>Add Course</b> to create the first
              one.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {courses.map((c) => {
                const weeks =
                  (c as any).weeks ?? parseWeeks(c.duration || "4 Weeks");
                const ppw =
                  ((c as any).pricePerWeek ??
                    parsePricePerWeek(c.priceLabel || "₦10k/wk")) ||
                  10000;
                const label = c.priceLabel || formatPriceLabel(ppw);

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-blue-900 dark:text-white">
                          {c.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {c.description}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold">
                          {weeks} Weeks • {c.sessions} • {c.level} • {label}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleCourseActive(c)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                          (c as any).isActive !== false
                            ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                            : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                        }`}
                        title="Toggle visibility on landing page"
                      >
                        {(c as any).isActive !== false ? "Active" : "Hidden"}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        onClick={() => openEditCourse(c)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(c)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Course Modal */}
        {courseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-2xl w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
              <button
                onClick={closeCourseModal}
                className="absolute top-6 right-6 text-slate-400 hover:text-blue-900 dark:hover:text-slate-200 transition"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-2">
                {editingCourse ? "Edit Course" : "Add New Course"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                This updates what students see in the landing page “Courses”
                section.
              </p>

              <form onSubmit={saveCourse} className="space-y-4">
                {courseError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    {courseError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Title
                  </label>
                  <input
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="e.g. UI/UX for Developers"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Duration
                    </label>
                    <input
                      onBlur={() => {
                        const w = parseWeeks(courseForm.duration);
                        setCourseForm((p) => ({
                          ...p,
                          weeks: w,
                          duration: `${w} Weeks`,
                          syllabus: normalizeSyllabus(p.syllabus, w),
                        }));
                      }}
                      value={courseForm.duration}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          duration: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder="e.g. 6 Weeks"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-bold">
                      Weeks (truth): {courseForm.weeks}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Sessions
                    </label>
                    <input
                      value={courseForm.sessions}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          sessions: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder="e.g. 2× Weekly"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Level
                    </label>
                    <input
                      value={courseForm.level}
                      onChange={(e) =>
                        setCourseForm((p) => ({ ...p, level: e.target.value }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder="Beginner / Intermediate / Advanced"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Price Label
                    </label>
                    <input
                      onBlur={() => {
                        const ppw = parsePricePerWeek(courseForm.priceLabel);
                        const safe = ppw || courseForm.pricePerWeek || 10000;
                        setCourseForm((p) => ({
                          ...p,
                          pricePerWeek: safe,
                          priceLabel: formatPriceLabel(safe),
                        }));
                      }}
                      value={courseForm.priceLabel}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          priceLabel: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder="e.g. ₦10k/wk"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-bold">
                      Price/week (truth): ₦
                      {Number(courseForm.pricePerWeek || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Weeks (Number)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={courseForm.weeks}
                      onChange={(e) => {
                        const w = Math.max(
                          1,
                          parseInt(e.target.value || "1", 10),
                        );
                        setCourseForm((p) => ({
                          ...p,
                          weeks: w,
                          duration: `${w} Weeks`,
                          syllabus: normalizeSyllabus(p.syllabus, w),
                        }));
                      }}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Price Per Week (Number)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={courseForm.pricePerWeek}
                      onChange={(e) => {
                        const ppw = Math.max(
                          0,
                          parseInt(e.target.value || "0", 10),
                        );
                        setCourseForm((p) => ({
                          ...p,
                          pricePerWeek: ppw,
                          priceLabel: formatPriceLabel(ppw),
                        }));
                      }}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Description
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[120px]"
                    placeholder="Short course overview…"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Image URL (optional)
                    </label>
                    <input
                      value={courseForm.imageUrl}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          imageUrl: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Syllabus View (optional fallback)
                    </label>
                    <input
                      value={courseForm.syllabusView}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          syllabusView: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      placeholder='e.g. "path-flutter"'
                    />
                  </div>
                </div>

                <div className="mt-4 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-black text-blue-900 dark:text-white">
                        Syllabus Builder
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        This is what “View Syllabus” will display for this
                        course.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSyllabusWeek}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                    >
                      + Add Week
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(courseForm.syllabus || []).map((w, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Week {idx + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeSyllabusWeek(idx)}
                            className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          value={w.title}
                          onChange={(e) =>
                            updateSyllabusWeekTitle(idx, e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-blue-900 dark:text-white outline-none mb-3"
                          placeholder={`Week ${idx + 1} title`}
                        />

                        <textarea
                          value={(w.topics || []).join("\n")}
                          onChange={(e) =>
                            updateSyllabusWeekTopics(idx, e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-blue-900 dark:text-white outline-none min-h-[90px]"
                          placeholder={
                            "Topics (one per line)\n- Topic 1\n- Topic 2"
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    Tip: Weeks are auto-trimmed on save.
                  </p>
                </div>

                <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={courseForm.isActive}
                    onChange={(e) =>
                      setCourseForm((p) => ({
                        ...p,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  Show on landing page
                </label>

                <button
                  type="submit"
                  className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
                >
                  {editingCourse ? "Save Changes" : "Create Course"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Session Modal */}
        {sessionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-2xl w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
              <button
                onClick={closeSessionModal}
                className="absolute top-6 right-6 text-slate-400 hover:text-blue-900 dark:hover:text-slate-200 transition"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-2">
                {editingSession ? "Edit Session" : "Add Session"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Creates a session under this cohort’s schedule.
              </p>

              <form onSubmit={saveSession} className="space-y-4">
                {sessionError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    {sessionError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Title
                  </label>
                  <input
                    value={sessionForm.title}
                    onChange={(e) =>
                      setSessionForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="e.g. Week 1 Live Class"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) =>
                        setSessionForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={sessionForm.time}
                      onChange={(e) =>
                        setSessionForm((p) => ({ ...p, time: e.target.value }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      required
                    />
                    
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      min={15}
                      value={sessionForm.durationMins}
                      onChange={(e) =>
                        setSessionForm((p) => ({
                          ...p,
                          durationMins: parseInt(e.target.value || "60", 10),
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Join URL (optional)
                  </label>
                  <input
                    value={sessionForm.joinUrl}
                    onChange={(e) =>
                      setSessionForm((p) => ({ ...p, joinUrl: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="Zoom/Meet link..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={sessionForm.notes}
                    onChange={(e) =>
                      setSessionForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[110px]"
                    placeholder="Any admin notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
                >
                  {editingSession ? "Save Session" : "Create Session"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Registrations Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex shadow-sm">
              {["All", "Pending", "Complete"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? "bg-blue-900 dark:bg-teal-600 text-white shadow-md"
                      : "text-slate-400 hover:text-blue-900 dark:hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, path..."
              className="px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest hover:underline"
            >
              Download CSV
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 text-red-600 text-xs font-black uppercase tracking-widest hover:underline"
            >
              Clear Database
            </button>
          </div>
        </div>

        {/* Registrations Table */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-10">
            <p className="text-slate-500 dark:text-slate-400">
              Loading registrations...
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Student Info
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Path & Duration
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Total Price
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Payment Status
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-8 py-20 text-center text-slate-400 font-medium italic"
                      >
                        No registration records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((reg) => (
                      <tr
                        key={reg.uid}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-xs">
                              {reg.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-blue-900 dark:text-white leading-tight">
                                {reg.fullName}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-1">
                                {reg.email}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {reg.phone} · {reg.gender}
                                {(reg as any).pendingPayment ? (
                                  <span className="ml-2 text-purple-600 font-black">
                                    • Pending Pay
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                            {reg.path}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {reg.weeksToCommit} Weeks
                          </span>
                        </td>

                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-blue-900 dark:text-teal-500">
                            ₦{Number(reg.totalPrice || 0).toLocaleString()}
                          </p>
                        </td>

                        <td className="px-8 py-6">
                          <button
                            onClick={() =>
                              handleToggleStatus(reg.uid, reg.status)
                            }
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                              reg.status === "Complete"
                                ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                                : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                            }`}
                          >
                            {reg.status}
                          </button>
                        </td>

                        <td className="px-8 py-6">
                          <button
                            onClick={() => handleDelete(reg.uid)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                            title="Delete Registration"
                            aria-label="Delete Registration"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer status */}
        <div className="mt-16 p-8 bg-blue-900 dark:bg-slate-900 rounded-[2rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h3 className="text-2xl font-black mb-4">Infrastructure Status</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 bg-teal-400 rounded-full" />
                <span className="text-sm font-medium">
                  Firebase Auth: <span className="text-teal-400">ONLINE</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${webhookUrl ? "bg-teal-400" : "bg-orange-400"}`}
                />
                <span className="text-sm font-medium">
                  Sheets Binding:{" "}
                  {webhookUrl ? (
                    <span className="text-teal-400">CONNECTED</span>
                  ) : (
                    <span className="text-orange-200">NOT CONFIGURED</span>
                  )}
                </span>
              </li>
            </ul>
          </div>

          <div className="md:w-1/2 p-6 bg-white/5 dark:bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xs text-blue-100/70 mb-2 uppercase tracking-widest font-bold">
              Admin Notice
            </p>
            <p className="text-xs leading-relaxed opacity-80">
              Keep approvals consistent: approve pending payments only after
              verifying Paystack reference. Cohorts/sessions are admin-managed
              and visible to students based on your app UI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
