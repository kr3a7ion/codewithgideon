import React, { useEffect, useMemo, useState } from "react";
import { View } from "../src/App";
import {
  registrationStore,
  RegistrationEntry,
  CourseDoc,
  CohortDoc,
  SessionDoc,
  ActiveCohortForPath,
  PathDoc,
  SyllabusWeek,
  CohortMessageDoc,
} from "../services/registrationStore";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  RefreshCw,
  LogOut,
  Settings2,
  Database,
  Users,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  FolderTree,
  GraduationCap,
  CalendarDays,
  CreditCard,
  Inbox,
  Mail,
  ExternalLink,
  Copy,
  MessageSquare,
  Search,
  AlertCircle,
  X,
  Send,
  BellRing,
  BookOpen,
} from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

interface AdminDashboardProps {
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const getCohortDocId = (c: any) => String(c?.id || "").trim();
const getCohortKey = (c: any) => String(c?.cohortKey || "").trim();

// optional: pick cohort by cohortKey (when you only have cohortKey)
const findCohortDocIdByKey = (list: any[], cohortKey: string) => {
  const key = String(cohortKey || "").trim();
  if (!key) return "";
  const hit = (list || []).find(
    (c) => String(c?.cohortKey || "").trim() === key,
  );
  return hit ? String(hit.id) : "";
};
type ContactMessageDoc = {
  id: string;
  name: string;
  email: string;
  message: string;
  status?: string;
  source?: string;
  createdAt?: any;
  auth?: {
    uid?: string | null;
  };
  appCheck?: {
    appId?: string | null;
  };
};

type CourseForm = {
  pathId: string;

  title: string;
  duration: string;
  sessions: string;
  level: string;
  description: string;
  priceLabel: string;
  imageUrl: string;
  syllabusView: string;

  isActive: boolean;
  showOnLanding: boolean;
  showInExplore: boolean;

  weeks: number;
  pricePerWeek: number;
  syllabus: SyllabusWeek[];
};

const emptyCourse: CourseForm = {
  pathId: "",

  title: "",
  duration: "4 Weeks",
  sessions: "2× Weekly",
  level: "Beginner",
  description: "",
  priceLabel: "₦10k/wk",
  imageUrl: "",
  syllabusView: "",

  isActive: true,
  showOnLanding: true,
  showInExplore: true,

  weeks: 4,
  pricePerWeek: 10000,
  syllabus: [{ week: 1, title: "Introduction", topics: ["Overview", "Setup"] }],
};

type SessionForm = {
  title: string;
  week: number;
  pathId: string; // NEW
  path: string; // legacy label kept too
  isPublished: boolean;

  date: string;
  time: string;
  durationMins: number;
  joinUrl: string;
  recordingUrl: string;
  notes: string;
};

const emptySession: SessionForm = {
  title: "",
  week: 1,
  pathId: "",
  path: "",
  isPublished: true,

  date: "",
  time: "18:00",
  durationMins: 60,
  joinUrl: "",
  recordingUrl: "",
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

const sessionTimeToMs = (t: any) => {
  if (!t) return Date.now();
  if (typeof t === "number") return t;
  if (typeof t === "string") {
    const n = Date.parse(t);
    return Number.isFinite(n) ? n : Date.now();
  }
  if (typeof t?.toMillis === "function") return t.toMillis();
  return Date.now();
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const toDateMs = (v: any): number => {
  if (!v) return 0;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
};

const formatInboxDate = (v: any) => {
  const ms = toDateMs(v);
  if (!ms) return "Unknown date";
  return new Date(ms).toLocaleString();
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

  // -------------------------
  // PATHS
  // -------------------------
  const [paths, setPaths] = useState<PathDoc[]>([]);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [newPathTitle, setNewPathTitle] = useState("");
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [editingPathTitle, setEditingPathTitle] = useState("");

  // -------------------------
  // Inbox (Contact Messages)
  // -------------------------
  const [inboxMessages, setInboxMessages] = useState<ContactMessageDoc[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState("");
  const [selectedInboxId, setSelectedInboxId] = useState<string>("");
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState<
    | "paths"
    | "cohorts"
    | "sessions"
    | "messages"
    | "courses"
    | "payments"
    | "registrations"
  >("paths");

  const pathsById = useMemo(() => {
    const m = new Map<string, PathDoc>();
    (paths || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [paths]);

  // ✅ Legacy mapper: title -> pathId (for old docs missing pathId)
  const findPathIdByTitle = (title: string) => {
    const key = String(title || "")
      .trim()
      .toLowerCase();
    if (!key) return "";
    const hit = (paths || []).find((p) => p.title.trim().toLowerCase() === key);
    return hit?.id || "";
  };

  const fetchPaths = async () => {
    setPathsLoading(true);
    try {
      const list = await registrationStore.getPaths(true);
      setPaths(list || []);
    } catch (e) {
      console.error("fetchPaths failed:", e);
      setPaths([]);
    } finally {
      setPathsLoading(false);
    }
  };

  const createPath = async () => {
    const title = newPathTitle.trim();
    if (title.length < 2) return alert("Path title is too short.");
    if (pathBusyId) return;

    setPathBusyId("create");
    try {
      await registrationStore.addPath({ title, isActive: true });
      setNewPathTitle("");
      await fetchPaths();
    } catch (e: any) {
      console.error("createPath failed:", e);
      alert(e?.message || "Failed to create path.");
    } finally {
      setPathBusyId(null);
    }
  };

  const startEditPath = (p: PathDoc) => {
    setEditingPathId(p.id);
    setEditingPathTitle(p.title);
  };

  const cancelEditPath = () => {
    setEditingPathId(null);
    setEditingPathTitle("");
  };

  const saveEditPath = async () => {
    if (!editingPathId) return;
    const title = editingPathTitle.trim();
    if (title.length < 2) return alert("Path title is too short.");
    try {
      await registrationStore.updatePath(editingPathId, { title });
      cancelEditPath();
      await fetchPaths();
    } catch (e: any) {
      console.error("saveEditPath failed:", e);
      alert(e?.message || "Failed to update path.");
    }
  };

  const togglePathActive = async (p: PathDoc) => {
    if (pathBusyId) return;
    setPathBusyId(p.id);
    try {
      await registrationStore.updatePath(p.id, {
        isActive: !(p.isActive !== false),
      });
      await fetchPaths();
    } catch (e: any) {
      console.error("togglePathActive failed:", e);
      alert(e?.message || "Failed to toggle path.");
    } finally {
      setPathBusyId(null);
    }
  };

  const deletePath = async (p: PathDoc) => {
    if (pathBusyId) return;
    if (
      !confirm(
        `Delete path "${p.title}"?\n\nOnly do this if you are sure no course/session depends on it.`,
      )
    )
      return;

    setPathBusyId(p.id);
    try {
      await registrationStore.deletePath(p.id);
      await fetchPaths();
    } catch (e: any) {
      console.error("deletePath failed:", e);
      alert(e?.message || "Failed to delete path.");
    } finally {
      setPathBusyId(null);
    }
  };

  // -------------------------
  // Courses
  // -------------------------
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDoc | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);
  const [courseError, setCourseError] = useState("");

  // Cohorts + sessions manager
  const [cohorts, setCohorts] = useState<CohortDoc[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionDoc | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySession);
  const [sessionError, setSessionError] = useState("");
  const [cohortMessages, setCohortMessages] = useState<CohortMessageDoc[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageForm, setMessageForm] = useState({
    title: "",
    body: "",
    ctaLabel: "",
    ctaUrl: "",
  });
  const [messageError, setMessageError] = useState("");

  const [pathBusy, setPathBusy] = useState(false);
  const [courseBusy, setCourseBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [pathBusyId, setPathBusyId] = useState<string | null>(null);
  const [courseBusyId, setCourseBusyId] = useState<string | null>(null);
  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null);
  const [pendingBusyUid, setPendingBusyUid] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string>("");
  const [inboxFilter, setInboxFilter] = useState<
    "all" | "new" | "read" | "resolved"
  >("all");

  // global busy map for all buttons
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const runBusy = async (key: string, fn: () => Promise<void>) => {
    if (busy[key]) return;
    setBusy((p) => ({ ...p, [key]: true }));
    try {
      await fn();
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  };

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
        title: String((w as any)?.title || "").trim(),
        topics: Array.isArray((w as any)?.topics)
          ? (w as any).topics.map((t: any) => String(t).trim()).filter(Boolean)
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
  const fetchInboxMessages = async () => {
    setInboxLoading(true);
    setInboxError("");

    try {
      const q = query(
        collection(db, "contactMessages"),
        orderBy("createdAt", "desc"),
        limit(30),
      );

      const snap = await getDocs(q);

      const list: ContactMessageDoc[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ContactMessageDoc, "id">),
      }));

      setInboxMessages(list);

      if (!selectedInboxId && list.length) {
        setSelectedInboxId(list[0].id);
      } else if (
        selectedInboxId &&
        !list.some((m) => m.id === selectedInboxId)
      ) {
        setSelectedInboxId(list[0]?.id || "");
      }
    } catch (e: any) {
      console.error("fetchInboxMessages failed:", e);
      setInboxMessages([]);
      setInboxError(
        e?.message || "Failed to load inbox. Check Firestore rules/index.",
      );
    } finally {
      setInboxLoading(false);
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
  const markInboxStatus = async (
    id: string,
    status: "new" | "read" | "resolved",
  ) => {
    if (!id) return;

    try {
      await updateDoc(doc(db, "contactMessages", id), {
        status,
      });

      setInboxMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    } catch (e) {
      console.error("markInboxStatus failed:", e);
      alert("Failed to update message status.");
    }
  };

  const deleteInboxMessage = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this message? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "contactMessages", id));

      setInboxMessages((prev) => prev.filter((m) => m.id !== id));

      if (selectedInboxId === id) {
        const remaining = inboxMessages.filter((m) => m.id !== id);
        setSelectedInboxId(remaining[0]?.id || "");
      }
    } catch (e) {
      console.error("deleteInboxMessage failed:", e);
      alert("Failed to delete message.");
    }
  };

  const fetchCohorts = async () => {
    setCohortsLoading(true);
    try {
      const list: CohortDoc[] = await registrationStore.getCohorts();
      const safe = (list || []).map((c: any) => ({
        ...c,
        id: String(c?.id || "").trim(),
        cohortKey: String(c?.cohortKey || "").trim(),
      }));

      setCohorts(safe);

      // ✅ always store cohort DOC ID in selectedCohortId
      if (!selectedCohortId && safe.length) {
        setSelectedCohortId(getCohortDocId(safe[0]));
      }

      if (list?.length) {
        const stillExists =
          selectedCohortId && list.some((c) => c.id === selectedCohortId);
        if (!stillExists) setSelectedCohortId(list[0].id);
      }
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
    setSessionsError("");

    try {
      const list = await registrationStore.getCohortSessions(cohortId);
      setSessions(list || []);
    } catch (e: any) {
      console.error("fetchSessions failed:", e);
      setSessions([]);
      setSessionsError(
        e?.message ||
          "Failed to load sessions. (If it mentions an index, create Firestore index or rely on fallback.)",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchCohortMessages = async (cohortId: string) => {
    if (!cohortId) {
      setCohortMessages([]);
      return;
    }

    setMessagesLoading(true);
    try {
      const list = await registrationStore.getCohortMessages(cohortId, 20);
      setCohortMessages(list || []);
    } catch (e) {
      console.error("fetchCohortMessages failed:", e);
      setCohortMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ✅ IMPORTANT: Paths first (Option A UI depends on it)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await fetchPaths();
        if (!mounted) return;

        await Promise.all([
          fetchRegistrations(),
          fetchCourses(),
          fetchCohorts(),
          fetchInboxMessages(),
        ]);
      } catch (e) {
        console.error("Admin init load failed:", e);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCohortId) {
      fetchSessions(selectedCohortId);
      fetchCohortMessages(selectedCohortId);
    } else {
      setCohortMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const ok = confirm(
      "DANGER: This will permanently delete ALL registration records. Are you absolutely sure?",
    );
    if (!ok) return;

    try {
      await registrationStore.clearAll();
      setRegistrations([]);
    } catch (e) {
      console.error("clearAll failed:", e);
      alert("Failed to clear all registrations.");
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) return alert("No data to export.");

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Path",
      "PathId",
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
      `"${String((reg as any).pathId || "")}"`,
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
        (r.path || "").toLowerCase().includes(q) ||
        String((r as any).pathId || "")
          .toLowerCase()
          .includes(q) // ✅ include pathId
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

  const selectedInboxMessage = useMemo(
    () => inboxMessages.find((m) => m.id === selectedInboxId) || null,
    [inboxMessages, selectedInboxId],
  );

  const unreadInboxCount = useMemo(
    () =>
      inboxMessages.filter(
        (m) => String(m.status || "new").toLowerCase() === "new",
      ).length,
    [inboxMessages],
  );
  const adminSections = useMemo(
    () =>
      [
        {
          key: "paths",
          label: "Paths",
          description: "Track setup and active season",
          icon: FolderTree,
          badge: paths.length,
        },
        {
          key: "cohorts",
          label: "Cohorts",
          description: "Manage cohort records",
          icon: Users,
          badge: cohorts.length,
        },
        {
          key: "sessions",
          label: "Sessions",
          description: "Schedule and publish classes",
          icon: CalendarDays,
          badge: sessions.length,
        },
        {
          key: "messages",
          label: "Messaging",
          description: "Send cohort announcements",
          icon: BellRing,
          badge: cohortMessages.length,
        },
        {
          key: "courses",
          label: "Courses",
          description: "Course catalog management",
          icon: BookOpen,
          badge: courses.length,
        },
        {
          key: "payments",
          label: "Payments",
          description: "Review pending confirmations",
          icon: CreditCard,
          badge: pendingPayments.length,
        },
        {
          key: "registrations",
          label: "Registrations",
          description: "Student enrollment records",
          icon: GraduationCap,
          badge: filteredData.length,
        },
      ] as const,
    [
      cohortMessages.length,
      cohorts.length,
      courses.length,
      filteredData.length,
      paths.length,
      pendingPayments.length,
      sessions.length,
    ],
  );

  const activeSectionMeta = adminSections.find(
    (section) => section.key === activeAdminSection,
  );

  // -------------------------
  // Courses actions
  // -------------------------
  const openAddCourse = () => {
    setCourseError("");
    setEditingCourse(null);

    const firstPath = paths[0];
    setCourseForm({
      ...emptyCourse,
      pathId: firstPath?.id || "",
      isActive: true,
      showOnLanding: true,
      showInExplore: true,
    });

    setCourseModalOpen(true);
  };

  const toggleCourseLanding = async (c: CourseDoc) => {
    const current = (c as any).showOnLanding !== false;
    try {
      await registrationStore.updateCourse(c.id, {
        showOnLanding: !current,
      } as any);
      await fetchCourses();
    } catch (e) {
      console.error("toggleCourseLanding failed:", e);
    }
  };

  const toggleCourseExplore = async (c: CourseDoc) => {
    const current = (c as any).showInExplore !== false;
    try {
      await registrationStore.updateCourse(c.id, {
        showInExplore: !current,
      } as any);
      await fetchCourses();
    } catch (e) {
      console.error("toggleCourseExplore failed:", e);
    }
  };

  const inboxCounts = useMemo(() => {
    const all = inboxMessages.length;
    const fresh = inboxMessages.filter(
      (m) => String(m.status || "new").toLowerCase() === "new",
    ).length;
    const read = inboxMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "read",
    ).length;
    const resolved = inboxMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "resolved",
    ).length;

    return { all, new: fresh, read, resolved };
  }, [inboxMessages]);

  const filteredInboxMessages = useMemo(() => {
    if (inboxFilter === "all") return inboxMessages;

    return inboxMessages.filter(
      (m) => String(m.status || "new").toLowerCase() === inboxFilter,
    );
  }, [inboxMessages, inboxFilter]);

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

    // ✅ FIX: tolerate legacy (no pathId) by mapping by legacy stored title if any
    const incomingPathId = String((c as any).pathId || "").trim();
    const legacyPathTitle = String((c as any).path || "").trim();
    const mappedId = incomingPathId || findPathIdByTitle(legacyPathTitle);
    const safePathId = mappedId || (paths[0]?.id ?? "");

    setCourseForm({
      pathId: safePathId,

      title: c.title || "",
      duration: c.duration || `${inferredWeeks} Weeks`,
      sessions: c.sessions || "2× Weekly",
      level: c.level || "Beginner",
      description: c.description || "",
      priceLabel: c.priceLabel || formatPriceLabel(inferredPricePerWeek),
      imageUrl: c.imageUrl || "",
      syllabusView: (c as any).syllabusView || "",

      isActive: (c as any).isActive !== false,
      showOnLanding: (c as any).showOnLanding !== false,
      showInExplore: (c as any).showInExplore !== false,

      weeks: inferredWeeks,
      pricePerWeek: inferredPricePerWeek,
      syllabus: normalizeSyllabus(inferredSyllabus, inferredWeeks),
    });

    setCourseModalOpen(true);
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError("");

    const title = courseForm.title.trim();
    const description = courseForm.description.trim();

    if (!courseForm.pathId)
      return setCourseError("Select a Path for this course.");
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
      pathId: courseForm.pathId,

      title,
      duration: `${weeks} Weeks`,
      sessions: String(courseForm.sessions || "2× Weekly").trim(),
      level: String(courseForm.level || "Beginner").trim(),
      description,
      priceLabel: formatPriceLabel(pricePerWeek),
      imageUrl: String(courseForm.imageUrl || "").trim(),
      syllabusView: String(courseForm.syllabusView || "").trim(),

      isActive: courseForm.isActive ?? true,
      showOnLanding: courseForm.showOnLanding ?? true,
      showInExplore: courseForm.showInExplore ?? true,

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
      !confirm(`Delete course "${c.title}"? This will remove it from the site.`)
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

  // -------------------------
  // ACTIVE COHORT (PER PATH) — Option A safe preview
  // -------------------------
  const [activePathId, setActivePathId] = useState<string>("");
  const [activeSeasonKey, setActiveSeasonKey] = useState("2026-03");
  const [activeSeasonLabel, setActiveSeasonLabel] =
    useState("March 2026 Cohort");

  const [computedCohortId, setComputedCohortId] = useState("");
  const [computedCohortKey, setComputedCohortKey] = useState("");
  const [cohortSaving, setCohortSaving] = useState(false);

  // ✅ Option A identity helpers (pathId drives identity; title is display-only)
  const computeCohortIdFromPathId = (pathId: string) => `path_${pathId}`;
  const computeCohortKeyFromPathId = (pathId: string, seasonKey: string) =>
    registrationStore.computeCohortKey(
      computeCohortIdFromPathId(pathId),
      seasonKey,
    );

  useEffect(() => {
    if (!activePathId && paths.length) setActivePathId(paths[0].id);
  }, [paths, activePathId]);

  useEffect(() => {
    try {
      if (!activePathId) {
        setComputedCohortId("");
        setComputedCohortKey("");
        return;
      }
      const cid = computeCohortIdFromPathId(activePathId);
      const ckey = computeCohortKeyFromPathId(activePathId, activeSeasonKey);
      setComputedCohortId(cid);
      setComputedCohortKey(ckey);
    } catch {
      setComputedCohortId("");
      setComputedCohortKey("");
    }
  }, [activePathId, activeSeasonKey]);

  const saveActiveCohort = async () => {
    if (!activePathId) return alert("Pick a Path first.");
    if (!activeSeasonKey.trim()) return alert("Season Key is required.");
    if (!activeSeasonLabel.trim()) return alert("Season Label is required.");

    setCohortSaving(true);
    try {
      const res: ActiveCohortForPath =
        await registrationStore.setActiveCohortForPathId(activePathId, {
          seasonKey: activeSeasonKey,
          seasonLabel: activeSeasonLabel,
        } as any);

      // refresh cohorts list so we can map cohortKey -> cohortDocId
      await fetchCohorts();

      // ✅ map cohortKey -> doc id
      const docId =
        findCohortDocIdByKey(cohorts, res.cohortKey) ||
        findCohortDocIdByKey(
          await registrationStore.getCohorts(),
          res.cohortKey,
        );

      if (!docId) {
        console.warn(
          "Could not map cohortKey to cohort doc id:",
          res.cohortKey,
        );
        alert(
          `Active cohort set, but I couldn't auto-select it.\nCohortKey: ${res.cohortKey}`,
        );
        return;
      }

      setSelectedCohortId(docId);
      await fetchSessions(docId);

      alert(`Active cohort set for "${res.path}" → ${res.cohortKey}`);
    } catch (e: any) {
      console.error("saveActiveCohort failed:", e);
      alert(e?.message || "Failed to update active cohort.");
    } finally {
      setCohortSaving(false);
    }
  };

  const addCohort = async () => {
    if (!activePathId) return alert("Pick a Path first.");
    if (!activeSeasonKey.trim() || !activeSeasonLabel.trim()) {
      return alert("Set Season Key + Season Label first.");
    }

    try {
      const res = await registrationStore.setActiveCohortForPathId(
        activePathId,
        {
          seasonKey: activeSeasonKey,
          seasonLabel: activeSeasonLabel,
        } as any,
      );

      await fetchCohorts();

      const docId =
        findCohortDocIdByKey(cohorts, res.cohortKey) ||
        findCohortDocIdByKey(
          await registrationStore.getCohorts(),
          res.cohortKey,
        );

      if (!docId) {
        alert(
          `Cohort created, but couldn't auto-select it.\nCohortKey: ${res.cohortKey}`,
        );
        return;
      }

      setSelectedCohortId(docId);
      await fetchSessions(docId);
    } catch (e: any) {
      console.error("addCohort failed:", e);
      alert(e?.message || "Failed to create cohort.");
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
  // Sessions manager actions (pathId + label)
  // -------------------------
  const openAddSession = () => {
    setSessionError("");
    setEditingSession(null);

    const p = pathsById.get(activePathId) || paths[0];

    setSessionForm({
      ...emptySession,
      week: 1,
      pathId: p?.id || "",
      path: p?.title || "",
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

    const incomingPathId = String((s as any).pathId || "").trim();
    const legacyTitle = String((s as any).path || "").trim();

    // ✅ if session has no pathId, map by title
    const mappedId = incomingPathId || findPathIdByTitle(legacyTitle);
    const bestTitle =
      (mappedId && pathsById.get(mappedId)?.title) || legacyTitle || "";

    setSessionForm({
      title: s.title || "",
      week: Number((s as any).week || 1),
      pathId: mappedId,
      path: bestTitle,
      isPublished: (s as any).isPublished !== false,

      date: toLocalDateInput(ms),
      time: toLocalTimeInput(ms),
      durationMins: Number((s as any).durationMins || 60),
      joinUrl: String((s as any).joinUrl || ""),
      recordingUrl: String((s as any).recordingUrl || ""),
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

    if (!sessionForm.pathId)
      return setSessionError("Select a Path for this session.");

    const p = pathsById.get(sessionForm.pathId);
    const pathLabel = (p?.title || sessionForm.path || "").trim();
    if (!pathLabel) return setSessionError("Path title is missing.");

    const startsAt = combineDateTimeToMs(sessionForm.date, sessionForm.time);
    const durationMins = Math.max(
      15,
      Math.floor(Number(sessionForm.durationMins || 60)),
    );

    const payload: any = {
      title,
      week,
      pathId: sessionForm.pathId,
      path: pathLabel,
      isPublished: !!sessionForm.isPublished,
      startsAt,
      durationMins,
      joinUrl: sessionForm.joinUrl.trim(),
      recordingUrl: sessionForm.recordingUrl.trim(),
      notes: sessionForm.notes.trim(),
    };

    const key = editingSession ? "saveSession" : "createSession";

    await runBusy(key, async () => {
      try {
        if (editingSession) {
          await registrationStore.updateCohortSession(
            selectedCohortId,
            editingSession.id,
            payload,
          );
        } else {
          await registrationStore.addCohortSession(selectedCohortId, payload);
        }

        closeSessionModal();
        await fetchSessions(selectedCohortId);
      } catch (e: any) {
        console.error("saveSession failed:", e);
        setSessionError(e?.message || "Failed to save session.");
      }
    });
  };

  const deleteSession = async (s: SessionDoc) => {
    if (!selectedCohortId) return;
    if (sessionBusyId) return;
    if (!confirm(`Delete session "${s.title}"?`)) return;

    setSessionBusyId(s.id);
    try {
      await registrationStore.deleteCohortSession(selectedCohortId, s.id);
      await fetchSessions(selectedCohortId);
    } catch (e) {
      console.error("deleteSession failed:", e);
      alert("Failed to delete session.");
    } finally {
      setSessionBusyId(null);
    }
  };

  const sendMessageToCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError("");

    if (!selectedCohortId) {
      setMessageError("Select a cohort first.");
      return;
    }

    const title = messageForm.title.trim();
    const body = messageForm.body.trim();
    if (title.length < 3) {
      setMessageError("Message title must be at least 3 characters.");
      return;
    }
    if (body.length < 5) {
      setMessageError("Message body must be at least 5 characters.");
      return;
    }

    const cohortLabel =
      cohorts.find((c) => c.id === selectedCohortId)?.label || selectedCohortId;

    await runBusy("sendCohortMessage", async () => {
      try {
        await registrationStore.sendCohortMessage({
          cohortId: selectedCohortId,
          cohortLabel,
          title,
          body,
          ctaLabel: messageForm.ctaLabel.trim(),
          ctaUrl: messageForm.ctaUrl.trim(),
          sentBy: "admin",
        });
        setMessageForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" });
        await fetchCohortMessages(selectedCohortId);
      } catch (err: any) {
        console.error("sendMessageToCohort failed:", err);
        setMessageError(err?.message || "Failed to send cohort message.");
      }
    });
  };

  // -------------------------
  // Pending payment actions
  // -------------------------
  const clearPending = async (uid: string) => {
    if (pendingBusyUid) return;
    if (!confirm("Clear pending payment for this user?")) return;

    setPendingBusyUid(uid);
    try {
      await registrationStore.clearPendingPayment(uid);
      await fetchRegistrations();
    } catch (e) {
      console.error("clearPending failed:", e);
      alert("Failed to clear pending payment.");
    } finally {
      setPendingBusyUid(null);
    }
  };

  const approvePending = async (reg: RegistrationEntry) => {
    if (pendingBusyUid) return;
    const pending = (reg as any).pendingPayment;
    if (!pending) return;

    const ok = confirm(
      `Approve ${pending.kind.toUpperCase()} payment?\n\nUser: ${reg.fullName}\nWeeks: ${pending.weeks}\nAmount: ₦${Number(pending.amount || 0).toLocaleString()}\nRef: ${pending.reference}`,
    );
    if (!ok) return;

    setPendingBusyUid(reg.uid);
    try {
      if (pending.kind === "topup") {
        await registrationStore.approveTopUpFromPending(reg.uid, {
          weeks: pending.weeks,
          amount: pending.amount,
          reference: pending.reference,
        });
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
    } finally {
      setPendingBusyUid(null);
    }
  };

  // ---------- UI helpers ----------
  const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const BusyButton = ({
    busy,
    disabled,
    onClick,
    className,
    children,
    busyText,
    type = "button",
  }: {
    busy?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className: string;
    children: React.ReactNode;
    busyText?: string;
    type?: "button" | "submit";
  }) => {
    const isDisabled = !!disabled || !!busy;
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={`${className} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            <span>{busyText || "Processing..."}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  };
  useEffect(() => {
    if (!selectedInboxMessage?.id) return;

    const currentStatus = String(
      selectedInboxMessage.status || "new",
    ).toLowerCase();
    if (currentStatus !== "new") return;

    markInboxStatus(selectedInboxMessage.id, "read");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInboxMessage?.id]);

  useEffect(() => {
    if (!filteredInboxMessages.length) {
      setSelectedInboxId("");
      return;
    }

    const stillVisible = filteredInboxMessages.some(
      (m) => m.id === selectedInboxId,
    );

    if (!stillVisible) {
      setSelectedInboxId(filteredInboxMessages[0].id);
    }
  }, [filteredInboxMessages, selectedInboxId]);

  // -------------------------
  // RETURN JSX (your UI preserved)
  // -------------------------
  return (
    <div className="py-12 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {/* Header */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
                <LayoutDashboard size={14} />
                <span>Admin Control Center</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-blue-900 dark:text-white tracking-tight">
                Admin Control Center
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Manage paths, cohorts, sessions, payments, inbox, and
                integrations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setInboxFilter("all");
                  setShowInboxModal(true);
                  if (!inboxMessages.length) fetchInboxMessages();
                }}
                className="relative p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
                title="Open Inbox"
                aria-label="Open Inbox"
              >
                <Inbox className="w-5 h-5" />
                {unreadInboxCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadInboxCount > 9 ? "9+" : unreadInboxCount}
                  </span>
                )}
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  fetchPaths();
                  fetchRegistrations();
                  fetchCourses();
                  fetchCohorts();
                  fetchInboxMessages();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh All
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSyncToSheets}
                disabled={isSyncing}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isSyncing
                    ? "bg-gray-200 text-gray-500"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                }`}
              >
                {isSyncing ? <Spinner /> : <Database className="w-4 h-4" />}
                Sync to Sheets
              </motion.button>

              <button
                onClick={() => setShowConfig(true)}
                className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
                title="Configure Sheet Binding"
                aria-label="Configure Sheet Binding"
              >
                <Settings2 className="w-5 h-5" />
              </button>

              <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 hidden md:block" />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
        >
          {[
            {
              label: "Total Students",
              value: stats.total,
              icon: Users,
              valueClass: "text-blue-900 dark:text-white",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock3,
              valueClass: "text-orange-600",
            },
            {
              label: "Complete",
              value: stats.complete,
              icon: ShieldCheck,
              valueClass: "text-teal-600",
            },
            {
              label: "Revenue",
              value: `₦${stats.revenue.toLocaleString()}`,
              icon: CircleDollarSign,
              valueClass: "text-blue-900 dark:text-white",
            },
            {
              label: "Pending Payments",
              value: stats.pendingPaymentsCount,
              icon: CreditCard,
              valueClass: "text-purple-600",
            },
            {
              label: "Inbox (New)",
              value: unreadInboxCount,
              icon: Inbox,
              valueClass: "text-pink-600",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                whileHover={{ y: -2 }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {s.label}
                  </p>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className={`text-2xl font-black mt-3 ${s.valueClass}`}>
                  {s.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mb-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Dashboard Navigation
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose a workspace and focus on one admin task at a time.
              </p>
            </div>
            {activeSectionMeta ? (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-teal-900/20 border border-blue-100 dark:border-teal-800/30">
                <activeSectionMeta.icon className="w-4 h-4 text-blue-700 dark:text-teal-300" />
                <span className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-white">
                  {activeSectionMeta.label}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {adminSections.map((section) => {
              const Icon = section.icon;
              const active = activeAdminSection === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveAdminSection(section.key)}
                  className={`text-left p-4 rounded-2xl border transition ${
                    active
                      ? "bg-blue-900 dark:bg-teal-600 text-white border-blue-900 dark:border-teal-500 shadow-lg"
                      : "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-teal-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          active
                            ? "text-white"
                            : "text-blue-700 dark:text-teal-300"
                        }`}
                      />
                      <p
                        className={`text-xs font-black uppercase tracking-widest ${
                          active
                            ? "text-white"
                            : "text-blue-900 dark:text-white"
                        }`}
                      >
                        {section.label}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center font-black ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border border-gray-100 dark:border-slate-700"
                      }`}
                    >
                      {section.badge}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      active
                        ? "text-white/85"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {section.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* PATHS MANAGER */}
        {activeAdminSection === "paths" && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Paths Manager
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create and manage your learning paths (tracks). Everything else
                (courses, cohorts, sessions) ties to these.
              </p>
            </div>

            <button
              onClick={fetchPaths}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
            >
              Refresh Paths
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={newPathTitle}
              onChange={(e) => setNewPathTitle(e.target.value)}
              className="flex-1 px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
              placeholder="New Path Title (e.g. Flutter Development)"
            />
            <BusyButton
              busy={pathBusyId === "create"}
              disabled={!newPathTitle.trim()}
              onClick={createPath}
              className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
              busyText="Adding..."
            >
              + Add Path
            </BusyButton>
          </div>

          {pathsLoading ? (
            <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
              Loading paths…
            </div>
          ) : paths.length === 0 ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
              No paths yet. Create your first path above (recommended).
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paths.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {editingPathId === p.id ? (
                        <div className="space-y-3">
                          <input
                            value={editingPathTitle}
                            onChange={(e) =>
                              setEditingPathTitle(e.target.value)
                            }
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-blue-900 dark:text-white outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEditPath}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditPath}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold mt-1 break-all">
                            ID: {p.id}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePathActive(p)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                          p.isActive !== false
                            ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                            : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                        }`}
                      >
                        {p.isActive !== false ? "Active" : "Inactive"}
                      </button>

                      {editingPathId !== p.id ? (
                        <button
                          onClick={() => startEditPath(p)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                      ) : null}

                      <BusyButton
                        busy={pathBusyId === p.id}
                        onClick={() => deletePath(p)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                        busyText="Deleting..."
                      >
                        Delete
                      </BusyButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Active Cohort (PER PATH) */}
        {(activeAdminSection === "paths" ||
          activeAdminSection === "cohorts" ||
          activeAdminSection === "sessions" ||
          activeAdminSection === "messages") && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Active Cohort (Per Path)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                New student registrations use the active cohort mapped to their
                selected path.
              </p>
            </div>

            <button
              onClick={saveActiveCohort}
              disabled={
                cohortSaving ||
                !activePathId ||
                !activeSeasonKey.trim() ||
                !activeSeasonLabel.trim()
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Path
              </label>

              <select
                value={activePathId}
                onChange={(e) => setActivePathId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
              >
                {paths.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              {!paths.length ? (
                <p className="text-[11px] text-orange-600 mt-2 font-bold">
                  Create paths first (above), then set active cohort.
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Season Key
              </label>
              <input
                value={activeSeasonKey}
                onChange={(e) => setActiveSeasonKey(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. 2026-03"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-bold">
                Used to build cohortKey:{" "}
                <span className="text-slate-500">
                  {computedCohortKey || "—"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Season Label
              </label>
              <input
                value={activeSeasonLabel}
                onChange={(e) => setActiveSeasonLabel(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                placeholder="e.g. March 2026 Cohort"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-bold">
                cohortId:{" "}
                <span className="text-slate-500">
                  {computedCohortId || "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ✅ This sets the active cohort identity for this path:
              <span className="font-black"> {computedCohortKey || "—"}</span>.
              <br />
              Sessions are stored under a cohort document (Doc ID) in{" "}
              <span className="font-black">/cohorts</span> →{" "}
              <span className="font-black">
                {selectedCohortId || "Select a cohort above"}
              </span>{" "}
              and its <span className="font-black">/sessions</span>{" "}
              subcollection.
            </p>
          </div>
        </div>
        )}

        {/* Cohorts + Sessions Manager */}
        {(activeAdminSection === "cohorts" ||
          activeAdminSection === "sessions") && (
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

            <button
              onClick={addCohort}
              disabled={!activePathId}
              className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition mb-6 ${
                !activePathId
                  ? "bg-gray-200 text-gray-500"
                  : "bg-teal-600 text-white hover:bg-teal-500"
              }`}
            >
              + Add Cohort From Active Path + Season
            </button>

            {cohortsLoading ? (
              <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                Loading cohorts…
              </div>
            ) : cohorts.length === 0 ? (
              <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200">
                No cohorts yet. Set active cohort first (above), then add
                cohort.
              </div>
            ) : (
              <div className="space-y-3">
                {cohorts.map((c) => {
                  const isSelected = selectedCohortId === c.id;
                  const pathTitle = c.pathId
                    ? pathsById.get(String(c.pathId))?.title
                    : c.path || "";

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCohortId(c.id)} // ✅ doc id
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        isSelected
                          ? "border-blue-900 dark:border-teal-600 bg-blue-50 dark:bg-teal-900/20"
                          : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-blue-900 dark:text-white">
                            {c.label}
                          </p>

                          {/* ✅ show doc id (real storage location) */}
                          <p className="text-[11px] text-slate-400 font-bold mt-1 break-all">
                            Doc ID: {c.id}
                          </p>

                          {/* ✅ show cohortKey if present (identity metadata) */}
                          {c.cohortKey ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1 break-all">
                              cohortKey: {c.cohortKey}
                              {c.cohortKey === c.id ? (
                                <span className="ml-2 text-teal-600 font-black">
                                  • matches Doc ID
                                </span>
                              ) : (
                                <span className="ml-2 text-orange-600 font-black">
                                  • differs from Doc ID
                                </span>
                              )}
                            </p>
                          ) : null}

                          {/* ✅ show path identity */}
                          {c.pathId || c.path ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                              Path:{" "}
                              <span className="text-slate-600 dark:text-slate-200">
                                {pathTitle || "—"}
                              </span>
                              {c.pathId ? (
                                <span className="ml-2 text-slate-400 break-all">
                                  (pathId: {c.pathId})
                                </span>
                              ) : null}
                            </p>
                          ) : null}
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
                  );
                })}
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
                {sessionsError ? (
                  <div className="p-4 mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold">
                    {sessionsError}
                  </div>
                ) : null}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedCohortId
                    ? (() => {
                        const selected = cohorts.find(
                          (x) => x.id === selectedCohortId,
                        );
                        return (
                          <>
                            Cohort Doc ID:{" "}
                            <span className="font-black">
                              {selectedCohortId}
                            </span>
                            {selected?.cohortKey ? (
                              <>
                                {" "}
                                • cohortKey:{" "}
                                <span className="font-black">
                                  {selected.cohortKey}
                                </span>
                              </>
                            ) : null}
                          </>
                        );
                      })()
                    : "Select a cohort to manage sessions."}
                </p>
              </div>

              <BusyButton
                busy={false}
                disabled={!selectedCohortId || sessionsLoading}
                onClick={openAddSession}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !selectedCohortId
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-900 text-white hover:opacity-90"
                }`}
              >
                + Add Session
              </BusyButton>
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
                          ).toLocaleString()}{" "}
                          • {Number((s as any).durationMins || 60)} mins • Week{" "}
                          {(s as any).week || 1}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Path: {(s as any).path || "—"}{" "}
                          {(s as any).isPublished !== false ? (
                            <span className="ml-2 text-teal-600 font-black">
                              • Published
                            </span>
                          ) : (
                            <span className="ml-2 text-orange-600 font-black">
                              • Hidden
                            </span>
                          )}
                        </p>
                        {s.joinUrl ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">
                            Join: {s.joinUrl}
                          </p>
                        ) : null}
                        {(s as any).recordingUrl ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">
                            Recording: {(s as any).recordingUrl}
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
                        <BusyButton
                          busy={sessionBusyId === s.id}
                          onClick={() => deleteSession(s)}
                          className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:opacity-90 transition"
                          busyText="Deleting..."
                        >
                          Delete
                        </BusyButton>
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
        )}

        {activeAdminSection === "messages" && (
          <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-blue-900 dark:text-white">
                  Cohort Messaging
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Send announcements directly to students in the selected active
                  cohort.
                </p>
              </div>
              <button
                onClick={() => fetchCohortMessages(selectedCohortId)}
                disabled={!selectedCohortId}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !selectedCohortId
                    ? "bg-gray-200 text-gray-500"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-90"
                }`}
              >
                Refresh Messages
              </button>
            </div>

            <form onSubmit={sendMessageToCohort} className="space-y-4">
              {messageError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                  {messageError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Target Cohort
                  </label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  >
                    <option value="" disabled>
                      Select a cohort…
                    </option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-teal-900/20 border border-blue-100 dark:border-teal-800/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-teal-300">
                    Delivery Note
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Messages are written to{" "}
                    <span className="font-black">
                      cohorts/{selectedCohortId || "{cohortId}"}/messages
                    </span>{" "}
                    and can be consumed by the learner app.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={messageForm.title}
                  onChange={(e) =>
                    setMessageForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="Message title"
                  required
                />
                <input
                  value={messageForm.ctaUrl}
                  onChange={(e) =>
                    setMessageForm((p) => ({ ...p, ctaUrl: e.target.value }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                  placeholder="Optional action link (https://...)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <textarea
                  value={messageForm.body}
                  onChange={(e) =>
                    setMessageForm((p) => ({ ...p, body: e.target.value }))
                  }
                  className="md:col-span-2 w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none min-h-[120px]"
                  placeholder="Type announcement message for this cohort..."
                  required
                />
                <div className="space-y-3">
                  <input
                    value={messageForm.ctaLabel}
                    onChange={(e) =>
                      setMessageForm((p) => ({
                        ...p,
                        ctaLabel: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="Optional CTA label"
                  />
                  <BusyButton
                    type="submit"
                    busy={busy.sendCohortMessage}
                    disabled={!selectedCohortId}
                    className="w-full px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:opacity-90 transition"
                    busyText="Sending..."
                  >
                    <span className="inline-flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  </BusyButton>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">
                Recent Messages
              </h3>
              {messagesLoading ? (
                <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                  Loading messages…
                </div>
              ) : cohortMessages.length === 0 ? (
                <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 dark:text-slate-300">
                  No sent messages for this cohort yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {cohortMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30"
                    >
                      <p className="text-sm font-black text-blue-900 dark:text-white">
                        {msg.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatInboxDate((msg as any).sentAt)} •{" "}
                        {msg.cohortLabel}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 whitespace-pre-wrap">
                        {msg.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Payments Viewer */}
        {activeAdminSection === "payments" && (
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
                            <BusyButton
                              busy={pendingBusyUid === r.uid}
                              onClick={() => approvePending(r)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:opacity-90 transition"
                              busyText="Approving..."
                            >
                              Approve
                            </BusyButton>
                            <BusyButton
                              busy={pendingBusyUid === r.uid}
                              onClick={() => clearPending(r.uid)}
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-orange-600 text-white hover:opacity-90 transition"
                              busyText="Clearing..."
                            >
                              Clear
                            </BusyButton>
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
        )}

        {/* Inbox Modal */}
        <AnimatePresence>
          {showInboxModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-md p-3 md:p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.985 }}
                transition={{ duration: 0.2 }}
                className="mx-auto h-[92vh] max-w-7xl rounded-[2rem] border border-white/10 bg-white dark:bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.35)] overflow-hidden"
              >
                {/* Top bar */}
                <div className="relative border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/70">
                  <div className="absolute inset-0 pointer-events-none opacity-60">
                    <div className="absolute -top-10 right-20 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
                    <div className="absolute -bottom-10 left-24 h-28 w-28 rounded-full bg-teal-500/10 blur-2xl" />
                  </div>

                  <div className="relative flex flex-col gap-4 px-5 py-5 md:px-7 md:py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 text-pink-600 dark:text-pink-300 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                          <Inbox className="w-3.5 h-3.5" />
                          Contact Inbox
                        </div>

                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          Website Messages
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Review enquiries, reply quickly, and keep support
                          tidy.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={fetchInboxMessages}
                          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>

                        <button
                          onClick={() => setShowInboxModal(false)}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          aria-label="Close Inbox"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { key: "all", label: "All", count: inboxCounts.all },
                        { key: "new", label: "New", count: inboxCounts.new },
                        { key: "read", label: "Read", count: inboxCounts.read },
                        {
                          key: "resolved",
                          label: "Resolved",
                          count: inboxCounts.resolved,
                        },
                      ].map((tab) => {
                        const active = inboxFilter === tab.key;

                        return (
                          <button
                            key={tab.key}
                            onClick={() =>
                              setInboxFilter(
                                tab.key as "all" | "new" | "read" | "resolved",
                              )
                            }
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 border ${
                              active
                                ? "bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600 shadow-lg"
                                : "bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span
                              className={`min-w-[22px] h-[22px] px-1 rounded-full text-[10px] flex items-center justify-center ${
                                active
                                  ? "bg-white/15 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="grid h-[calc(92vh-158px)] grid-cols-1 xl:grid-cols-[380px_1fr]">
                  {/* Left rail */}
                  <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden">
                    <div className="h-full overflow-auto p-4 space-y-3">
                      {inboxError ? (
                        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 text-sm font-bold inline-flex items-start gap-3 w-full">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <span>{inboxError}</span>
                        </div>
                      ) : inboxLoading ? (
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 inline-flex items-center gap-3 w-full shadow-sm">
                          <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-teal-400 animate-spin" />
                          Loading inbox…
                        </div>
                      ) : filteredInboxMessages.length === 0 ? (
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 shadow-sm">
                          No messages in this filter.
                        </div>
                      ) : (
                        filteredInboxMessages.map((m) => {
                          const isSelected = selectedInboxId === m.id;
                          const status = String(
                            m.status || "new",
                          ).toLowerCase();

                          return (
                            <button
                              key={m.id}
                              onClick={() => setSelectedInboxId(m.id)}
                              className={`w-full text-left rounded-3xl border p-4 transition-all shadow-sm ${
                                isSelected
                                  ? "border-blue-200 dark:border-teal-500/30 bg-white dark:bg-slate-900 ring-2 ring-blue-500/10 dark:ring-teal-500/10"
                                  : "border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                      {(m.name || "?").charAt(0).toUpperCase()}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                        {m.name || "Unknown sender"}
                                      </p>
                                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                                        {m.email || "No email"}
                                      </p>
                                    </div>
                                  </div>

                                  <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {m.message || "No message"}
                                  </p>
                                </div>

                                <span
                                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${
                                    status === "new"
                                      ? "bg-pink-50 border border-pink-200 text-pink-600 dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-300"
                                      : status === "resolved"
                                        ? "bg-teal-50 border border-teal-200 text-teal-600 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300"
                                        : "bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {status}
                                </span>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="text-[10px] font-bold text-slate-400">
                                  {formatInboxDate(m.createdAt)}
                                </span>

                                {isSelected ? (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-teal-300">
                                    Open
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right detail */}
                  <div className="bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="h-full overflow-auto p-5 md:p-7">
                      {!selectedInboxMessage ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="max-w-md text-center">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-5">
                              <Mail className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                              Select a message
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400">
                              Open a conversation from the left to preview and
                              manage it.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                            <div className="min-w-0">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Conversation
                              </div>

                              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white break-words">
                                {selectedInboxMessage.name || "Unknown sender"}
                              </h3>

                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 break-all">
                                {selectedInboxMessage.email}
                              </p>

                              <p className="text-[11px] text-slate-400 font-bold mt-3">
                                {formatInboxDate(
                                  selectedInboxMessage.createdAt,
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    selectedInboxMessage.email || "",
                                  )
                                }
                                className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Email
                              </button>

                              <button
                                onClick={() =>
                                  markInboxStatus(
                                    selectedInboxMessage.id,
                                    "read",
                                  )
                                }
                                className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                              >
                                Mark Read
                              </button>

                              <button
                                onClick={() =>
                                  markInboxStatus(
                                    selectedInboxMessage.id,
                                    "resolved",
                                  )
                                }
                                className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-500 transition"
                              >
                                Resolve
                              </button>

                              <a
                                href={`mailto:${selectedInboxMessage.email}`}
                                onClick={() =>
                                  markInboxStatus(
                                    selectedInboxMessage.id,
                                    "resolved",
                                  )
                                }
                                className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-900 text-white hover:bg-blue-800 transition inline-flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Reply
                              </a>

                              <button
                                onClick={() =>
                                  deleteInboxMessage(selectedInboxMessage.id)
                                }
                                className="px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Status
                              </p>
                              <p
                                className={`text-sm font-black mt-2 ${
                                  String(
                                    selectedInboxMessage.status || "new",
                                  ).toLowerCase() === "new"
                                    ? "text-pink-600 dark:text-pink-300"
                                    : String(
                                          selectedInboxMessage.status || "",
                                        ).toLowerCase() === "resolved"
                                      ? "text-teal-600 dark:text-teal-300"
                                      : "text-blue-900 dark:text-white"
                                }`}
                              >
                                {selectedInboxMessage.status || "new"}
                              </p>
                            </div>

                            <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Source
                              </p>
                              <p className="text-sm font-black text-slate-900 dark:text-white mt-2">
                                {selectedInboxMessage.source ||
                                  "web-contact-form"}
                              </p>
                            </div>

                            <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Auth UID
                              </p>
                              <p className="text-sm font-black text-slate-900 dark:text-white mt-2 break-all">
                                {selectedInboxMessage.auth?.uid || "Anonymous"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 inline-flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Message Body
                            </p>
                            <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-7 whitespace-pre-wrap break-words">
                              {selectedInboxMessage.message ||
                                "No message content."}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
        {activeAdminSection === "courses" && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-blue-900 dark:text-white">
                Course Catalog
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add / edit courses shown on the landing page and explore pages.
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
                disabled={!paths.length}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                  !paths.length
                    ? "bg-gray-200 text-gray-500"
                    : "bg-teal-600 text-white hover:bg-teal-500"
                }`}
              >
                + Add Course
              </button>
            </div>
          </div>

          {!paths.length ? (
            <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-200 mb-6">
              Create at least one Path first. Courses must belong to a Path.
            </div>
          ) : null}

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

                const pTitle = (c as any).pathId
                  ? pathsById.get(String((c as any).pathId))?.title
                  : null;

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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
                          Path:{" "}
                          <span className="text-slate-600 dark:text-slate-200">
                            {pTitle || "—"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCourseLanding(c)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            (c as any).showOnLanding !== false
                              ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400"
                              : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                          }`}
                          title="Toggle landing page visibility"
                        >
                          {(c as any).showOnLanding !== false
                            ? "Landing: ON"
                            : "Landing: OFF"}
                        </button>

                        <button
                          onClick={() => toggleCourseExplore(c)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            (c as any).showInExplore !== false
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-blue-300"
                              : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
                          }`}
                          title="Toggle Explore All Paths visibility"
                        >
                          {(c as any).showInExplore !== false
                            ? "Explore: ON"
                            : "Explore: OFF"}
                        </button>
                      </div>
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
        )}

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
                This updates what students see across your site.
              </p>

              <form onSubmit={saveCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    value={courseForm.imageUrl}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="https://... (jpeg/png/webp)"
                  />

                  {/* Optional preview (safe) */}
                  {courseForm.imageUrl?.trim() ? (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={courseForm.imageUrl.trim()}
                        alt="Course preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    </div>
                  ) : null}
                </div>
                {courseError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    {courseError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Path
                  </label>
                  <select
                    value={courseForm.pathId}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, pathId: e.target.value }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select a path…
                    </option>
                    {paths.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
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
                    Active
                  </label>

                  <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={courseForm.showOnLanding}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          showOnLanding: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Show on Landing
                  </label>

                  <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={courseForm.showInExplore}
                      onChange={(e) =>
                        setCourseForm((p) => ({
                          ...p,
                          showInExplore: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Show in Explore
                  </label>
                </div>

                <BusyButton
                  type="submit"
                  busy={courseBusyId === (editingCourse?.id || "create")}
                  className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
                  busyText={editingCourse ? "Saving..." : "Creating..."}
                >
                  {editingCourse ? "Save Changes" : "Create Course"}
                </BusyButton>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Week
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={sessionForm.week}
                      onChange={(e) =>
                        setSessionForm((p) => ({
                          ...p,
                          week: Math.max(
                            1,
                            parseInt(e.target.value || "1", 10),
                          ),
                        }))
                      }
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Path
                    </label>
                    <select
                      value={sessionForm.pathId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const t = pathsById.get(id)?.title || "";
                        setSessionForm((p) => ({ ...p, pathId: id, path: t }));
                      }}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                      required
                    >
                      <option value="" disabled>
                        Select a path…
                      </option>
                      {paths.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>

                    <label className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={sessionForm.isPublished}
                        onChange={(e) =>
                          setSessionForm((p) => ({
                            ...p,
                            isPublished: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Published (visible to students)
                    </label>
                  </div>
                </div>

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
                    Live Session URL (optional)
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
                    Recorded Session URL (optional)
                  </label>
                  <input
                    value={sessionForm.recordingUrl}
                    onChange={(e) =>
                      setSessionForm((p) => ({
                        ...p,
                        recordingUrl: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white outline-none"
                    placeholder="Loom/Drive/YouTube recording link..."
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
                  disabled={busy.createSession || busy.saveSession}
                  className="w-full ... disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {busy.createSession || busy.saveSession ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>
                        {editingSession ? "Saving..." : "Creating..."}
                      </span>
                    </>
                  ) : editingSession ? (
                    "Save Session"
                  ) : (
                    "Create Session"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeAdminSection === "registrations" && (
          <>
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
              placeholder="Search name, email, phone, path, pathId..."
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
                    filteredData.map((reg) => {
                      const regPathTitle = (reg as any).pathId
                        ? pathsById.get(String((reg as any).pathId))?.title
                        : null;

                      return (
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
                              {regPathTitle || reg.path}
                            </span>

                            {(reg as any).pathId ? (
                              <span className="text-[10px] text-slate-400 font-bold block">
                                ID: {String((reg as any).pathId)}
                              </span>
                            ) : null}

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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}

        {/* Footer status (unchanged) */}
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
                  className={`w-3 h-3 rounded-full ${
                    webhookUrl ? "bg-teal-400" : "bg-orange-400"
                  }`}
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
