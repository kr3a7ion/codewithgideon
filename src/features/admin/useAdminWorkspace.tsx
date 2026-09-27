/* All admin state, data loading and actions (moved from AdminDashboard.tsx). */
import React, { useEffect, useMemo, useState } from "react";
import { registrationStore, RegistrationEntry, CourseDoc, CohortDoc, SessionDoc, ActiveCohortForPath, PathDoc, SyllabusWeek, CohortMessageDoc, ResourceDoc, CommunitySpaceDoc } from "../../../services/registrationStore";
import { defaultSiteConfig, getSiteConfig, saveSiteConfig, SiteConfig } from "../../../services/siteConfig";
import { collection, collectionGroup, getDoc, getDocs, limit, query, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../../../services/firebase";
import { sessionDocId, type SessionDraft } from "./automation";
import {
  getCohortDocId,
  findCohortDocIdByKey,
  ContactMessageDoc,
  InboxThreadMessage,
  paymentRecordAmount,
  PaymentRecordDoc,
  AdminNotice,
  ConfirmDialogState,
  CourseForm,
  emptyCourse,
  SessionForm,
  emptySession,
  toLocalDateInput,
  toLocalTimeInput,
  combineDateTimeToMs,
  sessionTimeToMs,
  toDateMs,
  getInboxDisplayName,
  getInboxEmail,
  isMentorContactMessage,
  isUnreadLearnerChat,
  getInboxThreadCollection,
  normalizeInboxThreadMessage,
  sortInboxMessagesByActivity,
  mergeInboxThreadEntries,
} from "./lib";
import type { View } from "../../app/views";

export type AdminWorkspaceProps = {
  onNavigate: (view: View) => void;
  onLogout: () => void;
  sessionRemainingMs?: number;
};

export const useAdminWorkspace = ({
  onNavigate,
  onLogout,
  sessionRemainingMs = 0,
}: AdminWorkspaceProps) => {
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Complete">("All");
  const [search, setSearch] = useState("");
  const [adminNotice, setAdminNotice] = useState<AdminNotice | null>(null);
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogState | null>(null);

  const notify = (tone: AdminNotice["tone"], message: string) => {
    setAdminNotice({ tone, message });
  };

  const confirmAction = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmDialogState["tone"];
  }) =>
    new Promise<boolean>((resolve) => {
      setConfirmDialog({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        tone: options.tone || "warning",
        resolve,
      });
    });

  const closeConfirmDialog = (confirmed: boolean) => {
    setConfirmDialog((current) => {
      current?.resolve(confirmed);
      return null;
    });
  };

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
  // Mobile Chat (mentorThreads)
  // -------------------------
  const [inboxMessages, setInboxMessages] = useState<ContactMessageDoc[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState("");
  const [selectedInboxId, setSelectedInboxId] = useState<string>("");
  const [inboxThread, setInboxThread] = useState<InboxThreadMessage[]>([]);
  const [inboxThreadLoading, setInboxThreadLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);

  // -------------------------
  // Mail Support Inbox (contactMessages)
  // -------------------------
  const [supportMessages, setSupportMessages] = useState<ContactMessageDoc[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState("");
  const [selectedSupportId, setSelectedSupportId] = useState<string>("");
  const [supportFilter, setSupportFilter] = useState<
    "all" | "new" | "read" | "resolved"
  >("all");
  const [showSupportInboxModal, setShowSupportInboxModal] = useState(false);
  const [siteConfigForm, setSiteConfigForm] =
    useState<SiteConfig>(defaultSiteConfig);
  const [siteConfigLoading, setSiteConfigLoading] = useState(false);
  const [siteConfigError, setSiteConfigError] = useState("");
  const [siteConfigSaved, setSiteConfigSaved] = useState("");

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
    if (title.length < 2) {
      notify("info", "Path title is too short.");
      return;
    }
    if (pathBusyId) return;

    setPathBusyId("create");
    try {
      await registrationStore.addPath({ title, isActive: true });
      setNewPathTitle("");
      await fetchPaths();
    } catch (e: any) {
      console.error("createPath failed:", e);
      notify("error", e?.message || "Failed to create path.");
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
    if (title.length < 2) {
      notify("info", "Path title is too short.");
      return;
    }
    try {
      await registrationStore.updatePath(editingPathId, { title });
      cancelEditPath();
      await fetchPaths();
    } catch (e: any) {
      console.error("saveEditPath failed:", e);
      notify("error", e?.message || "Failed to update path.");
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
      notify("error", e?.message || "Failed to toggle path.");
    } finally {
      setPathBusyId(null);
    }
  };

  const deletePath = async (p: PathDoc) => {
    if (pathBusyId) return;
    const ok = await confirmAction({
      title: "Delete path?",
      message: `Delete "${p.title}"? Only do this if you are sure no course or session depends on it.`,
      confirmLabel: "Delete Path",
      tone: "danger",
    });
    if (!ok) return;

    setPathBusyId(p.id);
    try {
      await registrationStore.deletePath(p.id);
      await fetchPaths();
    } catch (e: any) {
      console.error("deletePath failed:", e);
      notify("error", e?.message || "Failed to delete path.");
    } finally {
      setPathBusyId(null);
    }
  };

  // -------------------------
  // Courses
  // -------------------------
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");
  const [communitySpaces, setCommunitySpaces] = useState<CommunitySpaceDoc[]>([]);
  const [communitySpacesLoading, setCommunitySpacesLoading] = useState(true);
  const [communitySpacesError, setCommunitySpacesError] = useState("");
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageBusyId, setMessageBusyId] = useState<string | null>(null);

  const [pathBusy, setPathBusy] = useState(false);
  const [courseBusy, setCourseBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [pathBusyId, setPathBusyId] = useState<string | null>(null);
  const [courseBusyId, setCourseBusyId] = useState<string | null>(null);
  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null);
  const [pendingBusyUid, setPendingBusyUid] = useState<string | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecordDoc[]>([]);
  const [paymentRecordsLoading, setPaymentRecordsLoading] = useState(false);
  const [paymentRecordsError, setPaymentRecordsError] = useState("");
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
      const [threadSnap, contactSnap] = await Promise.all([
        getDocs(collection(db, "mentorThreads")),
        getDocs(collection(db, "contactMessages")),
      ]);

      const list = sortInboxMessagesByActivity(
        [
          ...threadSnap.docs.map((doc) => ({
            id: doc.id,
            threadCollection: "mentorThreads" as const,
            ...(doc.data() as Omit<ContactMessageDoc, "id">),
          })),
          ...contactSnap.docs
            .map((doc) => ({
              id: doc.id,
              threadCollection: "contactMessages" as const,
              ...(doc.data() as Omit<ContactMessageDoc, "id">),
            }))
            .filter(isMentorContactMessage),
        ],
      );

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

  const fetchSupportMessages = async () => {
    setSupportLoading(true);
    setSupportError("");

    try {
      const snap = await getDocs(collection(db, "contactMessages"));
      const list = sortInboxMessagesByActivity(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ContactMessageDoc, "id">),
        })),
      ).filter((message) => !isMentorContactMessage(message));

      setSupportMessages(list);

      if (!selectedSupportId && list.length) {
        setSelectedSupportId(list[0].id);
      } else if (
        selectedSupportId &&
        !list.some((m) => m.id === selectedSupportId)
      ) {
        setSelectedSupportId(list[0]?.id || "");
      }
    } catch (e: any) {
      console.error("fetchSupportMessages failed:", e);
      setSupportMessages([]);
      setSupportError(
        e?.message || "Failed to load support inbox. Check Firestore rules.",
      );
    } finally {
      setSupportLoading(false);
    }
  };

  const fetchInboxThread = async (message: ContactMessageDoc | null) => {
    if (!message?.id) {
      setInboxThread([]);
      return;
    }

    setInboxThreadLoading(true);
    setReplyError("");

    try {
      const rootThread =
        getInboxThreadCollection(message) === "contactMessages"
          ? ([
              normalizeInboxThreadMessage(
                {
                  ...message,
                  senderType: "user",
                  senderName: getInboxDisplayName(message),
                  senderEmail: getInboxEmail(message),
                },
                `${message.id}-root`,
              ),
            ].filter(Boolean) as InboxThreadMessage[])
          : [];
      const q = query(
        collection(db, getInboxThreadCollection(message), message.id, "messages"),
        orderBy("createdAt", "asc"),
        limit(100),
      );
      const snap = await getDocs(q);
      const subcollectionThread = snap.docs
        .map((threadDoc, index) =>
          normalizeInboxThreadMessage(
            {
              id: threadDoc.id,
              ...(threadDoc.data() as Record<string, any>),
            },
            `${message.id}-sub-${index}`,
          ),
        )
        .filter(Boolean) as InboxThreadMessage[];

      setInboxThread(
        mergeInboxThreadEntries([...rootThread, ...subcollectionThread]),
      );
    } catch (e) {
      console.error("fetchInboxThread failed:", e);
      setInboxThread([]);
    } finally {
      setInboxThreadLoading(false);
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

  const fetchResources = async () => {
    setResourcesLoading(true);
    setResourcesError("");
    try {
      const list = await registrationStore.getResources();
      setResources(list || []);
    } catch (e: any) {
      console.error("Failed to load resources:", e);
      setResources([]);
      setResourcesError(
        e?.message || "Failed to load resources from Firestore.",
      );
    } finally {
      setResourcesLoading(false);
    }
  };

  const fetchCommunitySpaces = async () => {
    setCommunitySpacesLoading(true);
    setCommunitySpacesError("");
    try {
      const list = await registrationStore.getCommunitySpaces();
      setCommunitySpaces(list || []);
    } catch (e: any) {
      console.error("Failed to load community spaces:", e);
      setCommunitySpaces([]);
      setCommunitySpacesError(
        e?.message || "Failed to load community spaces from Firestore.",
      );
    } finally {
      setCommunitySpacesLoading(false);
    }
  };

  const markInboxStatus = async (
    id: string,
    status: "new" | "read" | "resolved",
  ) => {
    if (!id) return;

    try {
      const target = inboxMessages.find((m) => m.id === id) || null;
      await updateDoc(doc(db, getInboxThreadCollection(target), id), {
        status,
      });

      setInboxMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    } catch (e) {
      console.error("markInboxStatus failed:", e);
      notify("error", "Failed to update message status.");
    }
  };

  const deleteInboxMessage = async (id: string) => {
    if (!id) return;
    const ok = await confirmAction({
      title: "Delete mobile chat?",
      message: "This removes the selected chat thread from the admin inbox.",
      confirmLabel: "Delete Chat",
      tone: "danger",
    });
    if (!ok) return;

    try {
      const target = inboxMessages.find((m) => m.id === id) || null;
      await deleteDoc(doc(db, getInboxThreadCollection(target), id));

      setInboxMessages((prev) => {
        const next = prev.filter((m) => m.id !== id);
        setSelectedInboxId((current) =>
          current === id ? (next[0]?.id ?? "") : current,
        );
        return next;
      });
    } catch (e) {
      console.error("deleteInboxMessage failed:", e);
      notify("error", "Failed to delete message.");
    }
  };

  const markSupportStatus = async (
    id: string,
    status: "new" | "read" | "resolved",
  ) => {
    if (!id) return;

    try {
      await updateDoc(doc(db, "contactMessages", id), { status });
      setSupportMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    } catch (e) {
      console.error("markSupportStatus failed:", e);
      notify("error", "Failed to update support message status.");
    }
  };

  const deleteSupportMessage = async (id: string) => {
    if (!id) return;
    const ok = await confirmAction({
      title: "Delete support message?",
      message: "This removes the selected website support message.",
      confirmLabel: "Delete Message",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "contactMessages", id));
      setSupportMessages((prev) => {
        const next = prev.filter((m) => m.id !== id);
        setSelectedSupportId((current) =>
          current === id ? (next[0]?.id ?? "") : current,
        );
        return next;
      });
    } catch (e) {
      console.error("deleteSupportMessage failed:", e);
      notify("error", "Failed to delete support message.");
    }
  };

  const sendInboxReply = async () => {
    if (!selectedInboxMessage?.id || replyBusy) return;

    const body = replyDraft.trim();
    if (body.length < 2) {
      setReplyError("Reply must be at least 2 characters.");
      return;
    }

    setReplyBusy(true);
    setReplyError("");

    try {
      const adminLabel =
        auth.currentUser?.displayName ||
        auth.currentUser?.email ||
        "Admin Support";

      await addDoc(
        collection(
          db,
          getInboxThreadCollection(selectedInboxMessage),
          selectedInboxMessage.id,
          "messages",
        ),
        {
          body,
          message: body,
          senderType: "admin",
          senderRole: "admin",
          senderName: adminLabel,
          senderEmail: auth.currentUser?.email || "",
          source: "admin-dashboard",
          createdAt: serverTimestamp(),
        },
      );

      await updateDoc(
        doc(
          db,
          getInboxThreadCollection(selectedInboxMessage),
          selectedInboxMessage.id,
        ),
        {
        status: "resolved",
        lastMessage: body,
        lastMessagePreview: body,
        lastMessageSenderType: "admin",
        lastMessageSenderName: adminLabel,
        lastMessageSenderEmail: auth.currentUser?.email || "",
        lastMessageAt: serverTimestamp(),
        repliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        },
      );

      setReplyDraft("");
      await Promise.all([
        fetchInboxMessages(),
        fetchInboxThread(selectedInboxMessage),
      ]);
    } catch (e: any) {
      console.error("sendInboxReply failed:", e);
      setReplyError(e?.message || "Failed to send reply.");
    } finally {
      setReplyBusy(false);
    }
  };

  const fetchCohorts = async (): Promise<CohortDoc[]> => {
    let cohortList: CohortDoc[] = [];
    setCohortsLoading(true);
    try {
      const list: CohortDoc[] = await registrationStore.getCohorts();
      const safe = (list || []).map((c: any) => ({
        ...c,
        id: String(c?.id || "").trim(),
        cohortKey: String(c?.cohortKey || "").trim(),
      }));

      setCohorts(safe);
      cohortList = safe;

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
    return cohortList;
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

  const fetchPaymentRecords = async () => {
    setPaymentRecordsLoading(true);
    setPaymentRecordsError("");

    try {
      const snap = await getDocs(
        query(
          collectionGroup(db, "payments"),
          orderBy("verifiedAt", "desc"),
          limit(150),
        ),
      );

      const rows = snap.docs.map((paymentDoc) => {
        const data = paymentDoc.data() as any;
        const userId =
          paymentDoc.ref.parent.parent?.id || String(data.uid || "").trim();

        return {
          id: paymentDoc.id,
          userId,
          ...data,
        } as PaymentRecordDoc;
      });

      setPaymentRecords(rows);
    } catch (e) {
      console.error("fetchPaymentRecords failed:", e);
      setPaymentRecords([]);
      setPaymentRecordsError(
        "Verified payment records could not load. Check admin permissions if this stays empty.",
      );
    } finally {
      setPaymentRecordsLoading(false);
    }
  };

  const fetchSiteConfig = async () => {
    setSiteConfigLoading(true);
    setSiteConfigError("");

    try {
      const config = await getSiteConfig();
      setSiteConfigForm(config);
    } catch (e) {
      console.error("fetchSiteConfig failed:", e);
      setSiteConfigForm(defaultSiteConfig);
      setSiteConfigError(
        "Site settings could not load. Defaults are shown for now.",
      );
    } finally {
      setSiteConfigLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    await runBusy("refreshAll", async () => {
      try {
        await fetchPaths();

        const [, , , , , cohortList] = await Promise.all([
          fetchRegistrations(),
          fetchPaymentRecords(),
          fetchCourses(),
          fetchResources(),
          fetchCommunitySpaces(),
          fetchCohorts(),
          fetchInboxMessages(),
          fetchSupportMessages(),
          fetchSiteConfig(),
        ]);

        await Promise.all([
          fetchOverviewSessions(cohortList),
          fetchActiveCohorts(),
          fetchAutomationStatus(),
        ]);

        if (selectedCohortId) {
          await Promise.all([
            fetchSessions(selectedCohortId),
            fetchCohortMessages(selectedCohortId),
          ]);
        }

        if (selectedInboxMessage) {
          await fetchInboxThread(selectedInboxMessage);
        }
      } catch (e) {
        console.error("handleRefreshAll failed:", e);
        const message = `${(e as any)?.message || e || ""}`.toLowerCase();
        if (
          message.includes("permission") ||
          message.includes("missing or insufficient permissions")
        ) {
          setAdminNotice({
            tone: "error",
            message:
              "Failed to refresh dashboard data because Firestore admin permissions are blocked.",
          });
        } else {
          setAdminNotice({
            tone: "error",
            message: "Failed to refresh all dashboard data.",
          });
        }
      }
    });
  };

  // ✅ IMPORTANT: Paths first (Option A UI depends on it)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await handleRefreshAll();
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
      setAdminNotice({
        tone: "info",
        message: "Configure the Google Sheets webhook URL before syncing.",
      });
      setShowConfig(true);
      return;
    }
    if (registrations.length === 0) {
      setAdminNotice({
        tone: "info",
        message: "There is no registration data to sync yet.",
      });
      return;
    }

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

      setAdminNotice({
        tone: "success",
        message:
          "Sync signal sent to Google Sheets. Because this uses no-cors, the dashboard cannot read the webhook response.",
      });
    } catch (error) {
      console.error("Sync Error:", error);
      setAdminNotice({
        tone: "error",
        message: "Failed to connect to the Google Sheets webhook.",
      });
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
    await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
  };

  const handleDelete = async (uid: string) => {
    const ok = await confirmAction({
      title: "Delete registration?",
      message: "This permanently removes the selected registration record.",
      confirmLabel: "Delete Registration",
      tone: "danger",
    });
    if (!ok) return false;

    await registrationStore.delete(uid);
    await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
    return true;
  };

  const handleClearAll = async () => {
    const ok = await confirmAction({
      title: "Delete all registrations?",
      message:
        "This permanently deletes every registration record. Use this only for a confirmed cleanup.",
      confirmLabel: "Delete All",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await registrationStore.clearAll();
      setRegistrations([]);
    } catch (e) {
      console.error("clearAll failed:", e);
      notify("error", "Failed to clear all registrations.");
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      notify("info", "No registration data to export.");
      return;
    }

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
    const paymentsRevenue = paymentRecords.reduce(
      (sum, payment) => sum + paymentRecordAmount(payment),
      0,
    );
    const paidUids = new Set(
      paymentRecords.map((payment) => payment.userId).filter(Boolean),
    );
    const legacyRevenue = registrations
      .filter((r) => r.status === "Complete")
      .filter((r) => !paidUids.has(r.uid))
      .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
    const revenue = paymentsRevenue + legacyRevenue;

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
  }, [registrations, paymentRecords]);

  const pendingPayments = useMemo(() => {
    return registrations
      .filter((r) => !!(r as any).pendingPayment)
      .sort(
        (a, b) =>
          ((b as any).pendingPayment?.createdAt ?? 0) -
          ((a as any).pendingPayment?.createdAt ?? 0),
      );
  }, [registrations]);

  const registrationsByUid = useMemo(() => {
    const map = new Map<string, RegistrationEntry>();
    registrations.forEach((reg) => map.set(reg.uid, reg));
    return map;
  }, [registrations]);

  const formatPaymentAmount = (koboValue?: any, fallbackNaira?: any) => {
    const hasKobo =
      koboValue !== undefined && koboValue !== null && koboValue !== "";
    const kobo = Number(koboValue);
    if (hasKobo && Number.isFinite(kobo)) {
      const naira = kobo / 100;
      const hasDecimals = Math.abs(kobo % 100) > 0;
      return `₦${naira.toLocaleString(undefined, {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      })}`;
    }

    const hasFallback =
      fallbackNaira !== undefined && fallbackNaira !== null && fallbackNaira !== "";
    const fallback = Number(fallbackNaira);
    if (hasFallback && Number.isFinite(fallback)) {
      return `₦${fallback.toLocaleString()}`;
    }
    return "—";
  };

  const formatPaymentDate = (value: any) => {
    const ms = toDateMs(value);
    return ms ? new Date(ms).toLocaleString() : "—";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("success", "Copied to clipboard.");
    } catch {
      notify("error", "Copy failed because browser permissions blocked it.");
    }
  };

  const selectedInboxMessage = useMemo(
    () => inboxMessages.find((m) => m.id === selectedInboxId) || null,
    [inboxMessages, selectedInboxId],
  );

  const selectedSupportMessage = useMemo(
    () => supportMessages.find((m) => m.id === selectedSupportId) || null,
    [supportMessages, selectedSupportId],
  );

  const unreadInboxCount = useMemo(
    () => inboxMessages.filter(isUnreadLearnerChat).length,
    [inboxMessages],
  );

  const unreadSupportCount = useMemo(
    () =>
      supportMessages.filter(
        (m) => String(m.status || "new").toLowerCase() === "new",
      ).length,
    [supportMessages],
  );

  const totalInboxCount = inboxMessages.length;
  const totalSupportCount = supportMessages.length;


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
    const fresh = inboxMessages.filter(isUnreadLearnerChat).length;
    const read = inboxMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "read",
    ).length;
    const resolved = inboxMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "resolved",
    ).length;

    return { all, new: fresh, read, resolved };
  }, [inboxMessages]);

  const supportCounts = useMemo(() => {
    const all = supportMessages.length;
    const fresh = supportMessages.filter(
      (m) => String(m.status || "new").toLowerCase() === "new",
    ).length;
    const read = supportMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "read",
    ).length;
    const resolved = supportMessages.filter(
      (m) => String(m.status || "").toLowerCase() === "resolved",
    ).length;

    return { all, new: fresh, read, resolved };
  }, [supportMessages]);

  const filteredInboxMessages = useMemo(() => {
    if (inboxFilter === "all") return inboxMessages;
    if (inboxFilter === "new") {
      return inboxMessages.filter(isUnreadLearnerChat);
    }

    return inboxMessages.filter(
      (m) => String(m.status || "new").toLowerCase() === inboxFilter,
    );
  }, [inboxMessages, inboxFilter]);

  const filteredSupportMessages = useMemo(() => {
    if (supportFilter === "all") return supportMessages;

    return supportMessages.filter(
      (m) => String(m.status || "new").toLowerCase() === supportFilter,
    );
  }, [supportMessages, supportFilter]);

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
        : parsePricePerWeek(c.priceLabel || "") || 0;

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
        : parsePricePerWeek(courseForm.priceLabel || "");

    if (!weeks || weeks < 1) return setCourseError("Weeks must be at least 1.");
    if (!pricePerWeek || pricePerWeek < 100)
      return setCourseError(
        'Enter a valid weekly price, for example 10000.',
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
    const ok = await confirmAction({
      title: "Delete course?",
      message: `Delete "${c.title}"? This removes it from the public course catalog.`,
      confirmLabel: "Delete Course",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await registrationStore.deleteCourse(c.id);
      await fetchCourses();
    } catch (e) {
      console.error("Delete course failed:", e);
      notify("error", "Failed to delete course.");
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
    if (!activePathId) {
      setAdminNotice({ tone: "info", message: "Pick a path first." });
      return;
    }
    if (!activeSeasonKey.trim()) {
      setAdminNotice({ tone: "info", message: "Season key is required." });
      return;
    }
    if (!activeSeasonLabel.trim()) {
      setAdminNotice({ tone: "info", message: "Season label is required." });
      return;
    }

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
        setAdminNotice({
          tone: "info",
          message: `Active cohort set, but the dashboard could not auto-select ${res.cohortKey}.`,
        });
        return;
      }

      setSelectedCohortId(docId);
      await handleRefreshAll();

      setAdminNotice({
        tone: "success",
        message: `Active cohort set for "${res.path}" as ${res.cohortKey}.`,
      });
    } catch (e: any) {
      console.error("saveActiveCohort failed:", e);
      setAdminNotice({
        tone: "error",
        message: e?.message || "Failed to update active cohort.",
      });
    } finally {
      setCohortSaving(false);
    }
  };

  const addCohort = async () => {
    if (!activePathId) {
      setAdminNotice({ tone: "info", message: "Pick a path first." });
      return;
    }
    if (!activeSeasonKey.trim() || !activeSeasonLabel.trim()) {
      setAdminNotice({
        tone: "info",
        message: "Set season key and season label first.",
      });
      return;
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
        setAdminNotice({
          tone: "info",
          message: `Cohort created, but the dashboard could not auto-select ${res.cohortKey}.`,
        });
        return;
      }

      setSelectedCohortId(docId);
      await handleRefreshAll();
    } catch (e: any) {
      console.error("addCohort failed:", e);
      setAdminNotice({
        tone: "error",
        message: e?.message || "Failed to create cohort.",
      });
    }
  };

  const deleteCohort = async (c: CohortDoc) => {
    const ok = await confirmAction({
      title: "Delete cohort?",
      message: `Delete "${c.label}"? Sessions under it may become inaccessible.`,
      confirmLabel: "Delete Cohort",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await registrationStore.deleteCohort(c.id);
      if (selectedCohortId === c.id) {
        setSelectedCohortId("");
        setSessions([]);
      }
      await handleRefreshAll();
    } catch (e) {
      console.error("deleteCohort failed:", e);
      setAdminNotice({
        tone: "error",
        message: "Failed to delete cohort.",
      });
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
        await handleRefreshAll();
      } catch (e: any) {
        console.error("saveSession failed:", e);
        setSessionError(e?.message || "Failed to save session.");
      }
    });
  };

  const deleteSession = async (s: SessionDoc) => {
    if (!selectedCohortId) return;
    if (sessionBusyId) return;
    const ok = await confirmAction({
      title: "Delete session?",
      message: `Delete "${s.title}" from this cohort schedule?`,
      confirmLabel: "Delete Session",
      tone: "danger",
    });
    if (!ok) return;

    setSessionBusyId(s.id);
    try {
      await registrationStore.deleteCohortSession(selectedCohortId, s.id);
      await handleRefreshAll();
    } catch (e) {
      console.error("deleteSession failed:", e);
      setAdminNotice({
        tone: "error",
        message: "Failed to delete session.",
      });
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
        await handleRefreshAll();
      } catch (err: any) {
        console.error("sendMessageToCohort failed:", err);
        setMessageError(err?.message || "Failed to send cohort message.");
      }
    });
  };

  const startEditMessage = (msg: CohortMessageDoc) => {
    setEditingMessageId(msg.id);
    setMessageForm({
      title: msg.title,
      body: msg.body,
      ctaLabel: msg.ctaLabel || "",
      ctaUrl: msg.ctaUrl || "",
    });
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setMessageForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" });
  };

  const updateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessageId || !selectedCohortId) return;

    setMessageError("");
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

    setMessageBusyId(editingMessageId);
    try {
      await registrationStore.updateCohortMessage(
        selectedCohortId,
        editingMessageId,
        {
          title,
          body,
          ctaLabel: messageForm.ctaLabel.trim(),
          ctaUrl: messageForm.ctaUrl.trim(),
        },
      );
      setEditingMessageId(null);
      setMessageForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" });
      await handleRefreshAll();
    } catch (err: any) {
      console.error("updateMessage failed:", err);
      setMessageError(err?.message || "Failed to update message.");
    } finally {
      setMessageBusyId(null);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!selectedCohortId) return;
    const ok = await confirmAction({
      title: "Delete cohort message?",
      message: "This removes the announcement from this cohort message list.",
      confirmLabel: "Delete Message",
      tone: "danger",
    });
    if (!ok) return;

    setMessageBusyId(msgId);
    try {
      await registrationStore.deleteCohortMessage(selectedCohortId, msgId);
      if (editingMessageId === msgId) {
        cancelEditMessage();
      }
      await handleRefreshAll();
    } catch (err: any) {
      console.error("deleteMessage failed:", err);
      setMessageError(err?.message || "Failed to delete message.");
    } finally {
      setMessageBusyId(null);
    }
  };

  // -------------------------
  // Pending payment actions
  // -------------------------
  const clearPending = async (uid: string) => {
    if (pendingBusyUid) return;
    const ok = await confirmAction({
      title: "Clear pending payment?",
      message:
        "This removes the pending payment request without crediting access.",
      confirmLabel: "Clear Pending",
      tone: "warning",
    });
    if (!ok) return;

    setPendingBusyUid(uid);
    try {
      await registrationStore.clearPendingPayment(uid);
      await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
    } catch (e) {
      console.error("clearPending failed:", e);
      notify("error", "Failed to clear pending payment.");
    } finally {
      setPendingBusyUid(null);
    }
  };

  const approvePending = async (reg: RegistrationEntry) => {
    if (pendingBusyUid) return;
    const pending = (reg as any).pendingPayment;
    if (!pending) return;

    const ok = await confirmAction({
      title: "Manual payment override?",
      message: `Only continue after confirming this Paystack transaction in the gateway dashboard. User: ${reg.fullName}. Weeks: ${pending.weeks}. Amount: ₦${Number(pending.amount || 0).toLocaleString()}. Ref: ${pending.reference}.`,
      confirmLabel: "Reconcile Payment",
      tone: "warning",
    });
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
      await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
    } catch (e) {
      console.error("approvePending failed:", e);
      notify("error", "Failed to approve pending payment.");
    } finally {
      setPendingBusyUid(null);
    }
  };

  const updateSiteConfigField = <K extends keyof SiteConfig>(
    key: K,
    value: SiteConfig[K],
  ) => {
    setSiteConfigForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSiteConfigError("");
    setSiteConfigSaved("");
  };

  const updateSupportTopics = (value: string) => {
    updateSiteConfigField(
      "supportTopics",
      value
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
    );
  };

  const handleSaveSiteConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    setSiteConfigLoading(true);
    setSiteConfigError("");
    setSiteConfigSaved("");

    try {
      await saveSiteConfig(siteConfigForm);
      const fresh = await getSiteConfig();
      setSiteConfigForm(fresh);
      setSiteConfigSaved("Site settings saved.");
    } catch (e) {
      console.error("saveSiteConfig failed:", e);
      setSiteConfigError("Site settings could not be saved. Please try again.");
    } finally {
      setSiteConfigLoading(false);
    }
  };


  // ---------- UI helpers ----------
  useEffect(() => {
    let mentorThreadList: ContactMessageDoc[] = [];
    let legacyMentorList: ContactMessageDoc[] = [];
    const publishInbox = () => {
      setInboxMessages(
        sortInboxMessagesByActivity([...mentorThreadList, ...legacyMentorList]),
      );
      setInboxLoading(false);
      setInboxError("");
    };

    const unsubscribeMentorThreads = onSnapshot(
      collection(db, "mentorThreads"),
      (snap) => {
        mentorThreadList = snap.docs.map((doc) => ({
          id: doc.id,
          threadCollection: "mentorThreads" as const,
          ...(doc.data() as Omit<ContactMessageDoc, "id">),
        }));
        publishInbox();
      },
      (error) => {
        console.error("mentorThreads subscription failed:", error);
        setInboxError(
          (error as any)?.message ||
            "Failed to keep inbox synced. Check Firestore rules/index.",
        );
        setInboxLoading(false);
      },
    );

    const unsubscribeLegacyMentor = onSnapshot(
      collection(db, "contactMessages"),
      (snap) => {
        legacyMentorList = snap.docs
          .map((doc) => ({
            id: doc.id,
            threadCollection: "contactMessages" as const,
            ...(doc.data() as Omit<ContactMessageDoc, "id">),
          }))
          .filter(isMentorContactMessage);
        publishInbox();
      },
      (error) => {
        console.error("legacy mentor contactMessages subscription failed:", error);
        setInboxError(
          (error as any)?.message ||
            "Failed to keep inbox synced. Check Firestore rules/index.",
        );
        setInboxLoading(false);
      },
    );

    return () => {
      unsubscribeMentorThreads();
      unsubscribeLegacyMentor();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "contactMessages"),
      (snap) => {
        const list = sortInboxMessagesByActivity(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ContactMessageDoc, "id">),
          })),
        ).filter((message) => !isMentorContactMessage(message));

        setSupportMessages(list);
        setSupportLoading(false);
        setSupportError("");
      },
      (error) => {
        console.error("contactMessages subscription failed:", error);
        setSupportError(
          (error as any)?.message ||
            "Failed to keep support inbox synced. Check Firestore rules.",
        );
        setSupportLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedSupportMessage?.id) return;

    const currentStatus = String(
      selectedSupportMessage.status || "new",
    ).toLowerCase();
    if (currentStatus !== "new") return;

    markSupportStatus(selectedSupportMessage.id, "read");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupportMessage?.id]);

  useEffect(() => {
    if (!selectedInboxMessage) {
      setInboxThread([]);
      setReplyDraft("");
      setReplyError("");
      return;
    }

    setInboxThreadLoading(true);
    setReplyError("");

    const rootThread =
      getInboxThreadCollection(selectedInboxMessage) === "contactMessages"
        ? ([
            normalizeInboxThreadMessage(
              {
                ...selectedInboxMessage,
                senderType: "user",
                senderName: getInboxDisplayName(selectedInboxMessage),
                senderEmail: getInboxEmail(selectedInboxMessage),
              },
              `${selectedInboxMessage.id}-root`,
            ),
          ].filter(Boolean) as InboxThreadMessage[])
        : [];

    const threadQuery = query(
      collection(
        db,
        getInboxThreadCollection(selectedInboxMessage),
        selectedInboxMessage.id,
        "messages",
      ),
      orderBy("createdAt", "asc"),
      limit(200),
    );

    const unsubscribe = onSnapshot(
      threadQuery,
      (snap) => {
        const subcollectionThread = snap.docs
          .map((threadDoc, index) =>
            normalizeInboxThreadMessage(
              {
                id: threadDoc.id,
                ...(threadDoc.data() as Record<string, any>),
              },
              `${selectedInboxMessage.id}-sub-${index}`,
            ),
          )
          .filter(Boolean) as InboxThreadMessage[];

        setInboxThread(
          mergeInboxThreadEntries([...rootThread, ...subcollectionThread]),
        );
        setInboxThreadLoading(false);
      },
      (error) => {
        console.error("mentor chat thread subscription failed:", error);
        setInboxThread([]);
        setInboxThreadLoading(false);
      },
    );

    return () => unsubscribe();
  }, [selectedInboxMessage]);

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

  useEffect(() => {
    if (!filteredSupportMessages.length) {
      setSelectedSupportId("");
      return;
    }

    const stillVisible = filteredSupportMessages.some(
      (m) => m.id === selectedSupportId,
    );

    if (!stillVisible) {
      setSelectedSupportId(filteredSupportMessages[0].id);
    }
  }, [filteredSupportMessages, selectedSupportId]);

  // -------------------------
  // RETURN JSX (your UI preserved)
  // -------------------------

  // =========================================================
  // Admin redesign: overview data and automations
  // =========================================================
  const [activeByPath, setActiveByPath] = useState<
    Record<string, ActiveCohortForPath>
  >({});
  const [overviewSessions, setOverviewSessions] = useState<OverviewSession[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({});
  const [paymentChecks, setPaymentChecks] = useState<Record<string, PaymentCheck>>({});
  const [checkingRefs, setCheckingRefs] = useState<Record<string, boolean>>({});
  const [studentPayments, setStudentPayments] = useState<
    Record<string, PaymentRecordDoc[]>
  >({});

  /** activeCohorts/{pathId}: which intake new students join, per path. */
  async function fetchActiveCohorts() {
    try {
      const snap = await getDocs(collection(db, "activeCohorts"));
      const map: Record<string, ActiveCohortForPath> = {};
      snap.docs.forEach((d) => {
        map[d.id] = { ...(d.data() as ActiveCohortForPath) };
      });
      setActiveByPath(map);
    } catch (e) {
      console.error("fetchActiveCohorts failed:", e);
    }
  }

  /** Sessions across recent cohorts, for Today (classes, missing recordings). */
  async function fetchOverviewSessions(list: CohortDoc[] = cohorts) {
    setOverviewLoading(true);
    try {
      const recent = [...list]
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        .slice(0, 12);
      const results = await Promise.all(
        recent.map(async (c) => {
          try {
            const rows = await registrationStore.getCohortSessions(c.id);
            return (rows || []).map((session) => ({
              cohortId: c.id,
              cohortLabel: c.label || c.id,
              pathId: String((c as any).pathId || (session as any).pathId || ""),
              session,
            }));
          } catch {
            return [] as OverviewSession[];
          }
        }),
      );
      setOverviewSessions(results.flat());
    } finally {
      setOverviewLoading(false);
    }
  }

  async function fetchAutomationStatus() {
    try {
      const [payments, reminders] = await Promise.all([
        getDoc(doc(db, "automation", "payments")),
        getDoc(doc(db, "automation", "classReminders")),
      ]);
      setAutomationStatus({
        payments: payments.exists() ? (payments.data() as any) : null,
        classReminders: reminders.exists() ? (reminders.data() as any) : null,
      });
    } catch (e) {
      // Not deployed yet, or rules not updated: the page shows "not running".
      setAutomationStatus({ payments: null, classReminders: null });
    }
  }

  /** Ask Paystack about one checkout and credit it if it was paid. */
  const checkPaymentWithPaystack = async (uid: string, reference: string) => {
    const ref = String(reference || "").trim();
    if (!ref || checkingRefs[ref]) return null;
    setCheckingRefs((p) => ({ ...p, [ref]: true }));
    try {
      const call = httpsCallable<
        { reference: string; uid: string },
        { ok: boolean; outcome: PaymentCheck["outcome"]; message: string; weeks?: number }
      >(functions, "adminCheckPayment");
      const { data } = await call({ reference: ref, uid });
      const outcome = data?.outcome || (data?.ok ? "credited" : "error");
      const message = data?.message || "Checked.";
      const result: PaymentCheck = { outcome, message, at: Date.now() };
      setPaymentChecks((p) => ({ ...p, [ref]: result }));
      if (["credited", "already_credited", "needs_review"].includes(outcome)) {
        await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
      }
      return result;
    } catch (e: any) {
      const result: PaymentCheck = {
        outcome: "error",
        message:
          e?.message ||
          "Couldn't check this payment. Deploy the adminCheckPayment function, then try again.",
        at: Date.now(),
      };
      setPaymentChecks((p) => ({ ...p, [ref]: result }));
      return result;
    } finally {
      setCheckingRefs((p) => ({ ...p, [ref]: false }));
    }
  };

  const checkAllPending = async () => {
    await runBusy("checkAllPending", async () => {
      let credited = 0;
      let notPaid = 0;
      for (const reg of pendingPayments) {
        const pending = (reg as any).pendingPayment;
        const r = await checkPaymentWithPaystack(reg.uid, pending?.reference);
        if (r?.outcome === "credited" || r?.outcome === "already_credited") credited += 1;
        if (r?.outcome === "not_paid" || r?.outcome === "not_found") notPaid += 1;
      }
      notify(
        "success",
        `Checked ${pendingPayments.length} checkout${pendingPayments.length === 1 ? "" : "s"}: ${credited} credited, ${notPaid} not paid.`,
      );
    });
  };

  const fetchStudentPayments = async (uid: string) => {
    if (!uid) return;
    try {
      const snap = await getDocs(collection(db, "users", uid, "payments"));
      const rows = snap.docs
        .map((d) => ({ id: d.id, userId: uid, ...(d.data() as any) }) as PaymentRecordDoc)
        .sort((a, b) => toDateMs(b.verifiedAt) - toDateMs(a.verifiedAt));
      setStudentPayments((p) => ({ ...p, [uid]: rows }));
    } catch (e) {
      console.error("fetchStudentPayments failed:", e);
      setStudentPayments((p) => ({ ...p, [uid]: [] }));
    }
  };

  /**
   * Create many classes at once (generated or copied schedule). Classes that
   * already exist at the same week and start time are skipped, so running it
   * twice doesn't duplicate or overwrite anything.
   */
  const createSessionsBatch = async (
    cohortId: string,
    pathId: string,
    drafts: SessionDraft[],
  ) => {
    const path = pathsById.get(pathId);
    const pathTitle = String(path?.title || "").trim();
    if (!cohortId || !pathId || !pathTitle) {
      throw new Error("Pick a cohort whose course path still exists.");
    }
    const existing = await registrationStore.getCohortSessions(cohortId);
    // Skip anything that exists: same week + start time, or the same id
    // (a class keeps its id even after it's moved).
    const taken = new Set<string>();
    (existing || []).forEach((s) => {
      taken.add(`${s.week}|${Math.round(sessionTimeToMs((s as any).startsAt) / 60000)}`);
      taken.add(`id:${s.id}`);
    });

    let created = 0;
    let skipped = 0;
    let failed = 0;
    for (const d of drafts) {
      const key = `${d.week}|${Math.round(d.startsAtMs / 60000)}`;
      const idKey = `id:${sessionDocId(d.week, d.startsAtMs, pathId)}`;
      if (taken.has(key) || taken.has(idKey)) {
        skipped += 1;
        continue;
      }
      try {
      await registrationStore.addCohortSession(cohortId, {
        title: d.title,
        week: d.week,
        pathId,
        path: pathTitle,
        isPublished: d.isPublished,
        startsAt: d.startsAtMs,
        durationMins: d.durationMins,
        joinUrl: d.joinUrl,
        recordingUrl: "",
        notes: d.notes,
      } as any);
      taken.add(key);
      taken.add(idKey);
      created += 1;
      } catch (e) {
        console.error("createSessionsBatch: one class failed", d, e);
        failed += 1;
      }
    }

    if (selectedCohortId === cohortId) await fetchSessions(cohortId);
    await fetchOverviewSessions();
    return { created, skipped, failed };
  };

  /** Clear a "needs review" payment after crediting or refunding it by hand. */
  const markPaymentReviewed = async (payment: PaymentRecordDoc) => {
    if (!payment?.userId || !payment?.id) return;
    const ok = await confirmAction({
      title: "Mark as handled?",
      message:
        "Use this after you've credited the student yourself or refunded them in Paystack. It removes the payment from the review list.",
      confirmLabel: "Mark as handled",
      tone: "info",
    });
    if (!ok) return;
    try {
      await updateDoc(doc(db, "users", payment.userId, "payments", payment.id), {
        status: "reviewed",
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.email || "admin",
      });
      await fetchPaymentRecords();
      notify("success", "Payment marked as handled.");
    } catch (e: any) {
      notify("error", e?.message || "Couldn't update the payment.");
    }
  };

  /** Quick edits from lists (no modal): recording link, publish toggle. */
  const patchSession = async (
    cohortId: string,
    sessionId: string,
    patch: Record<string, any>,
  ) => {
    await registrationStore.updateCohortSession(cohortId, sessionId, patch as any);
    if (selectedCohortId === cohortId) await fetchSessions(cohortId);
    await fetchOverviewSessions();
  };

  /** Start a new intake for a path; new paying students join it. */
  const intakeCohortId = (pathId: string) => {
    const path = pathsById.get(pathId);
    const own = String(activeByPath[pathId]?.cohortId || "").toUpperCase();
    const guess = String(
      own || registrationStore.computeCohortIdFromPath(path?.title || pathId),
    ).toUpperCase();
    // Another path already uses this code (e.g. two titles containing "web")?
    const clash =
      Object.entries(activeByPath).some(
        ([pid, a]) =>
          pid !== pathId &&
          paths.some((p) => p.id === pid) &&
          String(a?.cohortId || "").toUpperCase() === guess,
      ) ||
      cohorts.some(
        (c: any) =>
          String(c.cohortId || "").toUpperCase() === guess &&
          c.pathId &&
          c.pathId !== pathId,
      );
    return clash ? pathId.replace(/[^A-Za-z0-9]/g, "_").toUpperCase() : guess;
  };

  const startIntake = async (pathId: string, seasonKey: string, label: string) => {
    const cohortId = intakeCohortId(pathId);
    const key = registrationStore.computeCohortKey(cohortId, seasonKey);
    const existing: any = cohorts.find((c) => c.id === key);
    if (existing?.pathId && existing.pathId !== pathId) {
      throw new Error(
        `${existing.label || key} belongs to another path. Pick a different month.`,
      );
    }
    const res = await registrationStore.setActiveCohortForPathId(pathId, {
      seasonKey,
      seasonLabel: label,
      cohortId,
    } as any);
    const list = await fetchCohorts();
    await Promise.all([fetchActiveCohorts(), fetchOverviewSessions(list)]);
    setSelectedCohortId(res.cohortKey);
    return res;
  };

  /** Used by Settings after a typed confirmation. */
  const clearAllRegistrationsConfirmed = async () => {
    await registrationStore.clearAll();
    setRegistrations([]);
  };

  const cohortStudentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    registrations.forEach((r) => {
      const key = String((r as any).cohortKey || "").trim();
      if (key && r.status === "Complete") map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [registrations]);


  return {
    onNavigate,
    onLogout,
    sessionRemainingMs,
    registrations,
    setRegistrations,
    loading,
    setLoading,
    filter,
    setFilter,
    search,
    setSearch,
    adminNotice,
    setAdminNotice,
    confirmDialog,
    setConfirmDialog,
    notify,
    confirmAction,
    closeConfirmDialog,
    isSyncing,
    setIsSyncing,
    showConfig,
    setShowConfig,
    webhookUrl,
    setWebhookUrl,
    paths,
    setPaths,
    pathsLoading,
    setPathsLoading,
    newPathTitle,
    setNewPathTitle,
    editingPathId,
    setEditingPathId,
    editingPathTitle,
    setEditingPathTitle,
    inboxMessages,
    setInboxMessages,
    inboxLoading,
    setInboxLoading,
    inboxError,
    setInboxError,
    selectedInboxId,
    setSelectedInboxId,
    inboxThread,
    setInboxThread,
    inboxThreadLoading,
    setInboxThreadLoading,
    replyDraft,
    setReplyDraft,
    replyError,
    setReplyError,
    replyBusy,
    setReplyBusy,
    showInboxModal,
    setShowInboxModal,
    supportMessages,
    setSupportMessages,
    supportLoading,
    setSupportLoading,
    supportError,
    setSupportError,
    selectedSupportId,
    setSelectedSupportId,
    supportFilter,
    setSupportFilter,
    showSupportInboxModal,
    setShowSupportInboxModal,
    siteConfigForm,
    setSiteConfigForm,
    siteConfigLoading,
    setSiteConfigLoading,
    siteConfigError,
    setSiteConfigError,
    siteConfigSaved,
    setSiteConfigSaved,
    pathsById,
    findPathIdByTitle,
    fetchPaths,
    createPath,
    startEditPath,
    cancelEditPath,
    saveEditPath,
    togglePathActive,
    deletePath,
    courses,
    setCourses,
    coursesLoading,
    setCoursesLoading,
    resources,
    setResources,
    resourcesLoading,
    setResourcesLoading,
    resourcesError,
    setResourcesError,
    communitySpaces,
    setCommunitySpaces,
    communitySpacesLoading,
    setCommunitySpacesLoading,
    communitySpacesError,
    setCommunitySpacesError,
    courseModalOpen,
    setCourseModalOpen,
    editingCourse,
    setEditingCourse,
    courseForm,
    setCourseForm,
    courseError,
    setCourseError,
    cohorts,
    setCohorts,
    cohortsLoading,
    setCohortsLoading,
    selectedCohortId,
    setSelectedCohortId,
    sessions,
    setSessions,
    sessionsLoading,
    setSessionsLoading,
    sessionModalOpen,
    setSessionModalOpen,
    editingSession,
    setEditingSession,
    sessionForm,
    setSessionForm,
    sessionError,
    setSessionError,
    cohortMessages,
    setCohortMessages,
    messagesLoading,
    setMessagesLoading,
    messageForm,
    setMessageForm,
    messageError,
    setMessageError,
    editingMessageId,
    setEditingMessageId,
    messageBusyId,
    setMessageBusyId,
    pathBusy,
    setPathBusy,
    courseBusy,
    setCourseBusy,
    sessionBusy,
    setSessionBusy,
    pathBusyId,
    setPathBusyId,
    courseBusyId,
    setCourseBusyId,
    sessionBusyId,
    setSessionBusyId,
    pendingBusyUid,
    setPendingBusyUid,
    paymentRecords,
    setPaymentRecords,
    paymentRecordsLoading,
    setPaymentRecordsLoading,
    paymentRecordsError,
    setPaymentRecordsError,
    sessionsError,
    setSessionsError,
    inboxFilter,
    setInboxFilter,
    busy,
    setBusy,
    runBusy,
    parseWeeks,
    parsePricePerWeek,
    formatPriceLabel,
    normalizeSyllabus,
    closeCourseModal,
    closeSessionModal,
    fetchRegistrations,
    fetchInboxMessages,
    fetchSupportMessages,
    fetchInboxThread,
    fetchCourses,
    fetchResources,
    fetchCommunitySpaces,
    markInboxStatus,
    deleteInboxMessage,
    markSupportStatus,
    deleteSupportMessage,
    sendInboxReply,
    fetchCohorts,
    fetchSessions,
    fetchCohortMessages,
    fetchPaymentRecords,
    fetchSiteConfig,
    handleRefreshAll,
    handleSaveWebhook,
    handleSyncToSheets,
    handleToggleStatus,
    handleDelete,
    handleClearAll,
    handleExportCSV,
    filteredData,
    stats,
    pendingPayments,
    registrationsByUid,
    formatPaymentAmount,
    formatPaymentDate,
    copyToClipboard,
    selectedInboxMessage,
    selectedSupportMessage,
    unreadInboxCount,
    unreadSupportCount,
    totalInboxCount,
    totalSupportCount,
    openAddCourse,
    toggleCourseLanding,
    toggleCourseExplore,
    inboxCounts,
    supportCounts,
    filteredInboxMessages,
    filteredSupportMessages,
    openEditCourse,
    saveCourse,
    deleteCourse,
    activePathId,
    setActivePathId,
    activeSeasonKey,
    setActiveSeasonKey,
    activeSeasonLabel,
    setActiveSeasonLabel,
    computedCohortId,
    setComputedCohortId,
    computedCohortKey,
    setComputedCohortKey,
    cohortSaving,
    setCohortSaving,
    computeCohortIdFromPathId,
    computeCohortKeyFromPathId,
    saveActiveCohort,
    addCohort,
    deleteCohort,
    openAddSession,
    openEditSession,
    saveSession,
    deleteSession,
    sendMessageToCohort,
    startEditMessage,
    cancelEditMessage,
    updateMessage,
    deleteMessage,
    clearPending,
    approvePending,
    updateSiteConfigField,
    updateSupportTopics,
    handleSaveSiteConfig,
    // admin redesign
    activeByPath,
    overviewSessions,
    overviewLoading,
    automationStatus,
    fetchAutomationStatus,
    fetchActiveCohorts,
    fetchOverviewSessions,
    paymentChecks,
    checkingRefs,
    checkPaymentWithPaystack,
    checkAllPending,
    studentPayments,
    fetchStudentPayments,
    createSessionsBatch,
    patchSession,
    startIntake,
    intakeCohortId,
    markPaymentReviewed,
    clearAllRegistrationsConfirmed,
    cohortStudentCounts,
  };
};

export type OverviewSession = {
  cohortId: string;
  cohortLabel: string;
  pathId: string;
  session: SessionDoc;
};

export type PaymentCheck = {
  outcome:
    | "credited"
    | "already_credited"
    | "needs_review"
    | "not_paid"
    | "not_found"
    | "error";
  message: string;
  at: number;
};

export type AutomationStatus = {
  payments?: Record<string, any> | null;
  classReminders?: Record<string, any> | null;
};

export type AdminWorkspace = ReturnType<typeof useAdminWorkspace>;
