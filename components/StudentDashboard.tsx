import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  LogOut,
  Users,
  CalendarDays,
  Clock3,
  BookOpen,
  Video,
  PlayCircle,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Lock,
  Phone,
  MessageSquare,
  Send,
  BadgeCheck,
  BellRing,
  Sparkles,
  Layers3,
  TimerReset,
} from "lucide-react";
import { View } from "../src/App";
import { db, functions } from "../services/firebase";
import {
  registrationStore,
  RegistrationEntry,
  SessionDoc,
  CourseDoc,
  ResourceDoc,
  CommunitySpaceDoc,
  CohortMessageDoc,
} from "../services/registrationStore";

interface StudentDashboardProps {
  onNavigate: (view: View, extraData?: unknown) => void;
  onLogout: () => void;
  profile: RegistrationEntry | null;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toMs = (v: any): number | null => {
  if (!v) return null;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "object" && typeof v.seconds === "number") {
    return v.seconds * 1000;
  }
  return null;
};

const parsePricePerWeek = (label: string, fallback = 0) => {
  const s = String(label || "").toLowerCase();
  const hasK = s.includes("k");
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return hasK ? num * 1000 : num;
};

type SessionTag = "LIVE" | "RECORDING SOON" | "JOIN LINK AVAILABLE";

type MentorChatMessage = {
  id: string;
  body: string;
  senderType: "user" | "admin" | "system";
  senderName?: string;
  senderEmail?: string;
  createdAt?: any;
};

type NotificationReadMap = Record<string, { readAt?: any }>;

type JourneyBadge = {
  badge: string;
  title: string;
  tagline: string;
  color: string;
  tier: string;
  week: number;
};

const allJourneyBadges = [
  {
    badge: "🌱",
    title: "First Step",
    tagline: "You showed up. That is everything.",
    color: "#4ade80",
    tier: "Starter",
  },
  {
    badge: "🔥",
    title: "On Fire",
    tagline: "Momentum is building. Keep it up.",
    color: "#fb923c",
    tier: "Ignited",
  },
  {
    badge: "⚡",
    title: "Live Wire",
    tagline: "You are in the zone. Keep sparking.",
    color: "#facc15",
    tier: "Charged",
  },
  {
    badge: "🏅",
    title: "One Month Strong",
    tagline: "A full month. You are built different.",
    color: "#c084fc",
    tier: "Milestone",
  },
  {
    badge: "💪",
    title: "Crushing It",
    tagline: "Look at you go. No slowing down.",
    color: "#f472b6",
    tier: "Crusher",
  },
  {
    badge: "🌊",
    title: "Halfway Hero",
    tagline: "Past the midpoint. You are doing this.",
    color: "#38bdf8",
    tier: "Midpoint",
  },
  {
    badge: "🎯",
    title: "Locked In",
    tagline: "Focused. Consistent. Unstoppable.",
    color: "#fb7185",
    tier: "Focused",
  },
  {
    badge: "🦅",
    title: "Soaring",
    tagline: "Flying high. Nothing stopping you now.",
    color: "#818cf8",
    tier: "Elevated",
  },
  {
    badge: "💎",
    title: "Diamond Grit",
    tagline: "Pressure makes diamonds. You are proof.",
    color: "#67e8f9",
    tier: "Diamond",
  },
  {
    badge: "🚀",
    title: "Launch Mode",
    tagline: "Final stretch. You are in launch mode.",
    color: "#a78bfa",
    tier: "Launch",
  },
  {
    badge: "⭐",
    title: "Almost Legendary",
    tagline: "One step left. Leave nothing behind.",
    color: "#fbbf24",
    tier: "Legend",
  },
  {
    badge: "🏆",
    title: "Champion",
    tagline: "You did it. Every single week. Champion.",
    color: "#f59e0b",
    tier: "Champion",
  },
];

const getBadgesForLength = (totalWeeks: number): JourneyBadge[] => {
  const safeWeeks = Math.max(1, Math.floor(Number(totalWeeks || 1)));
  if (safeWeeks === 1) return [{ ...allJourneyBadges[11], week: 1 }];
  if (safeWeeks >= 12) {
    return allJourneyBadges.map((badge, index) => ({
      ...badge,
      week: index + 1,
    }));
  }

  const indices = [0];
  const middleCount = safeWeeks - 2;
  for (let i = 0; i < middleCount; i += 1) {
    const idx = Math.round(1 + ((i + 1) * 10) / (middleCount + 1));
    indices.push(Math.min(idx, 10));
  }
  indices.push(11);

  return [...new Set(indices)].map((idx, index) => ({
    ...allJourneyBadges[idx],
    week: index + 1,
  }));
};

const buildMentorThreadId = (studentUid: string) =>
  `mentor_${String(studentUid || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")}`;

const buildNotificationReadId = (cohortKey: string, messageId: string) =>
  `${String(cohortKey || "cohort")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")}_${String(messageId || "message")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")}`;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

type StudentSection =
  | "dashboard"
  | "classes"
  | "resources"
  | "community"
  | "chat"
  | "notifications"
  | "badges";

const studentSectionRoutes: Record<StudentSection, string> = {
  dashboard: "/student/dashboard",
  classes: "/student/classes",
  resources: "/student/resources",
  community: "/student/community",
  chat: "/student/chat",
  notifications: "/student/notifications",
  badges: "/student/badges",
};

const sectionFromPathname = (pathname: string): StudentSection => {
  const path = String(pathname || "");
  if (path.includes("/student/classes")) return "classes";
  if (path.includes("/student/resources")) return "resources";
  if (path.includes("/student/community")) return "community";
  if (path.includes("/student/chat")) return "chat";
  if (path.includes("/student/notifications")) return "notifications";
  if (path.includes("/student/badges")) return "badges";
  return "dashboard";
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onLogout,
  profile,
}) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const activeSection = sectionFromPathname(location.pathname);

  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [communitySpaces, setCommunitySpaces] = useState<CommunitySpaceDoc[]>(
    [],
  );
  const [communityLoading, setCommunityLoading] = useState(true);
  const [cohortMessages, setCohortMessages] = useState<CohortMessageDoc[]>([]);
  const [cohortMessagesLoading, setCohortMessagesLoading] = useState(true);
  const [notificationReads, setNotificationReads] =
    useState<NotificationReadMap>({});
  const [notificationError, setNotificationError] = useState("");
  const [mentorMessages, setMentorMessages] = useState<MentorChatMessage[]>([]);
  const [mentorThreadMeta, setMentorThreadMeta] = useState<Record<
    string,
    any
  > | null>(null);
  const [mentorLoading, setMentorLoading] = useState(true);
  const [mentorDraft, setMentorDraft] = useState("");
  const [mentorSending, setMentorSending] = useState(false);
  const [mentorError, setMentorError] = useState("");
  const mentorThreadId = profile?.uid ? buildMentorThreadId(profile.uid) : "";

  const [courseLoading, setCourseLoading] = useState(true);
  const [courseMaxWeeks, setCourseMaxWeeks] = useState<number>(0);
  const [weeklyRate, setWeeklyRate] = useState<number>(0);
  const [courseError, setCourseError] = useState("");

  const [cohortLoading, setCohortLoading] = useState(true);
  const [activeForPath, setActiveForPath] = useState<{
    cohortId: string;
    cohortKey: string;
    label: string;
  } | null>(null);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpWeeks, setTopUpWeeks] = useState("1");
  const [showAllClassesModal, setShowAllClassesModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCohortForPath = async () => {
      if (!profile?.uid || !profile?.path) return;

      setCohortLoading(true);
      try {
        const safePath = profile.path;
        const inferredPathId =
          profile.pathId || (await registrationStore.resolvePathId(safePath));

        const active = inferredPathId
          ? await registrationStore.getActiveCohortForPathId(inferredPathId)
          : await registrationStore.getActiveCohortForPath(safePath);

        if (!mounted) return;

        // Display fallback only. A student's cohort is assigned by the
        // payment function when they pay; the dashboard must never move a
        // student into a newer cohort.
        setActiveForPath({
          cohortId: active.cohortId,
          cohortKey: active.cohortKey,
          label: active.label,
        });
      } catch {
        if (!mounted) return;
        setActiveForPath(null);
      } finally {
        if (!mounted) return;
        setCohortLoading(false);
      }
    };

    loadCohortForPath();
    return () => {
      mounted = false;
    };
  }, [profile?.uid, profile?.path, profile?.pathId]);

  const cohortId =
    profile?.cohortId || activeForPath?.cohortId || "CWG-DEFAULT";
  const cohortKey =
    profile?.cohortKey || activeForPath?.cohortKey || "CWG-DEFAULT";
  const cohortLabel =
    profile?.cohortLabel || activeForPath?.label || "Current Cohort";

  useEffect(() => {
    if (!profile?.uid) {
      setNotificationReads({});
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "users", profile.uid, "notificationReads"),
      (snap) => {
        const next: NotificationReadMap = {};
        snap.docs.forEach((readDoc) => {
          next[readDoc.id] = readDoc.data() as { readAt?: any };
        });
        setNotificationReads(next);
      },
      (error) => {
        console.error("notification reads subscription failed:", error);
        setNotificationReads({});
      },
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid || !cohortKey || cohortKey === "CWG-DEFAULT") {
      setCohortMessages([]);
      setCohortMessagesLoading(false);
      return;
    }

    setCohortMessagesLoading(true);
    setNotificationError("");

    const messagesQuery = query(
      collection(db, "cohorts", cohortKey, "messages"),
      orderBy("createdAt", "desc"),
      limit(30),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snap) => {
        setCohortMessages(
          snap.docs.map((messageDoc) => ({
            id: messageDoc.id,
            ...(messageDoc.data() as any),
          })) as CohortMessageDoc[],
        );
        setCohortMessagesLoading(false);
      },
      (error) => {
        console.error("cohort notification subscription failed:", error);
        setCohortMessages([]);
        setCohortMessagesLoading(false);
        setNotificationError(
          "We could not load cohort updates right now. Please refresh and try again.",
        );
      },
    );

    return () => unsubscribe();
  }, [profile?.uid, cohortKey]);

  useEffect(() => {
    let mounted = true;

    const loadCourse = async () => {
      if (!profile?.path) return;

      setCourseLoading(true);
      setCourseError("");

      const applyProfileFallback = () => {
        const profileWeeks = Number(profile.courseDurationWeeks || 0);
        const profileRate = Number(profile.weeklyRate || 0);
        if (profileWeeks > 0) setCourseMaxWeeks(profileWeeks);
        if (profileRate > 0) setWeeklyRate(profileRate);
        if (!(profileWeeks > 0 && profileRate > 0)) {
          setCourseError(
            "We could not sync your current course pricing. Please contact support before topping up.",
          );
        }
      };

      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c: any) => c.isActive !== false);

        const found = active.find((c: any) => {
          if (profile.courseId)
            return String(c.id) === String(profile.courseId);
          if (profile.pathId && c.pathId)
            return String(c.pathId) === String(profile.pathId);

          return (
            String(c.title || "")
              .trim()
              .toLowerCase() ===
            String(profile.path || "")
              .trim()
              .toLowerCase()
          );
        });

        if (!mounted) return;

        if (found) {
          const w = Number((found as any).weeks);
          const p = Number((found as any).pricePerWeek);

          const weeks =
            Number.isFinite(w) && w > 0
              ? Math.floor(w)
              : parseWeeksFromDuration((found as any).duration || "4", 4);

          const rate =
            Number.isFinite(p) && p > 0
              ? Math.floor(p)
              : parsePricePerWeek((found as any).priceLabel || "", 0);

          if (weeks > 0 && rate > 0) {
            setCourseMaxWeeks(weeks);
            setWeeklyRate(rate);
          } else {
            applyProfileFallback();
          }
        } else {
          applyProfileFallback();
        }
      } catch {
        if (!mounted) return;
        applyProfileFallback();
      } finally {
        if (!mounted) return;
        setCourseLoading(false);
      }
    };

    loadCourse();
    return () => {
      mounted = false;
    };
  }, [
    profile?.path,
    profile?.pathId,
    profile?.courseId,
    profile?.courseDurationWeeks,
    profile?.weeklyRate,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadSessions = async () => {
      if (!profile?.uid) return;

      setSessionsLoading(true);
      try {
        const unlocked =
          await registrationStore.getUnlockedSessionsForStudent(profile);

        if (!mounted) return;
        setSessions(unlocked || []);
      } catch {
        if (!mounted) return;
        setSessions([]);
      } finally {
        if (!mounted) return;
        setSessionsLoading(false);
      }
    };

    loadSessions();
    return () => {
      mounted = false;
    };
  }, [
    profile?.uid,
    profile?.pathId,
    profile?.path,
    profile?.cohortKey,
    profile?.cohortId,
    profile?.weeksToCommit,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadResources = async () => {
      if (!profile?.uid) return;

      setResourcesLoading(true);
      try {
        // Only an unpaid enrolment locks content; a pending top-up never
        // hides material the student has already paid for.
        const isLocked = profile.status !== "Complete";

        if (isLocked) {
          if (mounted) setResources([]);
          return;
        }

        const paidWeekLimit = Math.max(0, Number(profile.weeksToCommit || 0));
        const list = await registrationStore.getPublishedResources();

        const visible = (list || [])
          .filter((resource: any) => resource.isPublished !== false)
          .filter((resource: any) => {
            const resourceCourseId = String(resource.courseId || "").trim();
            const resourcePathId = String(resource.pathId || "").trim();

            if (
              resourceCourseId &&
              profile.courseId &&
              resourceCourseId !== String(profile.courseId)
            ) {
              return false;
            }

            if (
              resourcePathId &&
              profile.pathId &&
              resourcePathId !== String(profile.pathId)
            ) {
              return false;
            }

            const week = Number(resource.sessionWeek || 0);
            return !Number.isFinite(week) || week <= 0 || week <= paidWeekLimit;
          })
          .sort((a: any, b: any) => {
            const weekA = Number(a.sessionWeek || 999);
            const weekB = Number(b.sessionWeek || 999);
            if (weekA !== weekB) return weekA - weekB;
            return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
          });

        if (mounted) setResources(visible);
      } catch {
        if (mounted) setResources([]);
      } finally {
        if (mounted) setResourcesLoading(false);
      }
    };

    loadResources();
    return () => {
      mounted = false;
    };
  }, [
    profile?.uid,
    profile?.status,
    profile?.pendingPayment?.status,
    profile?.weeksToCommit,
    profile?.pathId,
    profile?.courseId,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadCommunitySpaces = async () => {
      if (!profile?.uid) return;

      setCommunityLoading(true);
      try {
        const activeCohortId =
          profile.cohortId || activeForPath?.cohortId || "CWG-DEFAULT";
        const list = await registrationStore.getPublishedCommunitySpaces();

        const visible = (list || [])
          .filter((space: any) => space.isPublished !== false)
          .filter((space: any) => {
            const spacePathId = String(space.pathId || "").trim();
            const spaceCohortId = String(space.cohortId || "").trim();

            if (
              spacePathId &&
              profile.pathId &&
              spacePathId !== String(profile.pathId)
            ) {
              return false;
            }

            if (
              spaceCohortId &&
              activeCohortId &&
              activeCohortId !== "CWG-DEFAULT" &&
              spaceCohortId !== String(activeCohortId)
            ) {
              return false;
            }

            return true;
          });

        if (mounted) setCommunitySpaces(visible);
      } catch {
        if (mounted) setCommunitySpaces([]);
      } finally {
        if (mounted) setCommunityLoading(false);
      }
    };

    loadCommunitySpaces();
    return () => {
      mounted = false;
    };
  }, [profile?.uid, profile?.pathId, profile?.cohortId, activeForPath?.cohortId]);

  useEffect(() => {
    if (!mentorThreadId) {
      setMentorMessages([]);
      setMentorThreadMeta(null);
      setMentorLoading(false);
      return;
    }

    setMentorLoading(true);
    setMentorError("");

    const threadRef = doc(db, "mentorThreads", mentorThreadId);
    const messagesQuery = query(
      collection(db, "mentorThreads", mentorThreadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );

    const unsubscribeThread = onSnapshot(
      threadRef,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setMentorThreadMeta(data);

        if (
          activeSection === "chat" &&
          data?.lastMessageSenderType === "admin"
        ) {
          updateDoc(threadRef, {
            status: "read",
            studentLastReadAt: serverTimestamp(),
          }).catch(() => {
            // Rules may keep read-state server/admin only. Chat still works.
          });
        }
      },
      (error) => {
        console.error("mentor thread subscription failed:", error);
        setMentorThreadMeta(null);
      },
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snap) => {
        const list = snap.docs.map((messageDoc) => {
          const data = messageDoc.data() as Record<string, any>;
          return {
            id: messageDoc.id,
            body: String(data.body || data.message || "").trim(),
            senderType:
              data.senderType === "admin" || data.senderRole === "admin"
                ? "admin"
                : data.senderType === "system"
                  ? "system"
                  : "user",
            senderName: String(data.senderName || "").trim(),
            senderEmail: String(data.senderEmail || "").trim(),
            createdAt: data.createdAt,
          } as MentorChatMessage;
        });

        setMentorMessages(list.filter((message) => message.body));
        setMentorLoading(false);
      },
      (error) => {
        console.error("mentor messages subscription failed:", error);
        setMentorMessages([]);
        setMentorLoading(false);
        setMentorError(
          "We could not load mentor chat right now. Please refresh and try again.",
        );
      },
    );

    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [mentorThreadId, activeSection]);

  const isEnrolled = profile?.status === "Complete";

  const paidWeeks = Math.max(0, Number(profile?.weeksToCommit || 0));
  const totalProgramWeeks = Math.max(1, Number(courseMaxWeeks || 1));
  const hasCoursePricing = courseMaxWeeks > 0 && weeklyRate > 0 && !courseError;

  const progressPercent = clamp((paidWeeks / totalProgramWeeks) * 100, 0, 100);
  // Locked only until the first payment is confirmed. A pending top-up is
  // shown as a notice but never hides weeks the student already paid for.
  const hasAnyPending = !isEnrolled;

  const hasPendingTopUp =
    profile?.pendingPayment?.status === "Pending" &&
    profile?.pendingPayment?.kind === "topup";

  const unreadCohortMessages = useMemo(
    () =>
      cohortMessages.filter((message) => {
        const readId = buildNotificationReadId(cohortKey, message.id);
        return !notificationReads[readId]?.readAt;
      }),
    [cohortMessages, cohortKey, notificationReads],
  );

  const mentorLastMessageAt = toMs(mentorThreadMeta?.lastMessageAt) || 0;
  const mentorLastReadAt = toMs(mentorThreadMeta?.studentLastReadAt) || 0;
  const hasUnreadMentorReply =
    activeSection !== "chat" &&
    mentorThreadMeta?.lastMessageSenderType === "admin" &&
    mentorLastMessageAt > mentorLastReadAt;

  const unreadNotificationCount =
    unreadCohortMessages.length + (hasUnreadMentorReply ? 1 : 0);

  const remainingWeeks = Math.max(0, totalProgramWeeks - paidWeeks);
  // An abandoned checkout must not block a new top-up.
  const canTopUp = isEnrolled && hasCoursePricing && remainingWeeks > 0;

  const joinedDate = new Date(
    profile?.timestamp || Date.now(),
  ).toLocaleDateString();

  const liveSession = useMemo(() => {
    if (hasAnyPending) return null;

    const nowMs = Date.now();

    const live = (sessions || [])
      .map((s) => {
        const startMs = toMs((s as any).startsAt);
        const endMs =
          toMs((s as any).endsAt) ??
          (startMs != null
            ? startMs + Number((s as any).durationMins || 60) * 60 * 1000
            : null);

        return {
          ...s,
          _startMs: startMs ?? NaN,
          _endMs: endMs ?? NaN,
        };
      })
      .filter((s) => Number.isFinite(s._startMs) && Number.isFinite(s._endMs))
      .find(
        (s) => (s._startMs as number) <= nowMs && nowMs <= (s._endMs as number),
      );

    return live || null;
  }, [sessions, hasAnyPending]);

  const nextSession = useMemo(() => {
    if (hasAnyPending) return null;

    const nowMs = Date.now();

    const upcoming = (sessions || [])
      .map((s) => ({ ...s, _ms: toMs((s as any).startsAt) ?? NaN }))
      .filter((s) => Number.isFinite(s._ms))
      .filter((s) => (s._ms as number) > nowMs)
      .sort((a, b) => (a._ms as number) - (b._ms as number));

    return upcoming[0] || null;
  }, [sessions, hasAnyPending]);

  const latestUnlockedSession = useMemo(() => {
    if (hasAnyPending) return null;

    const ordered = (sessions || [])
      .map((s) => ({ ...s, _ms: toMs((s as any).startsAt) ?? NaN }))
      .filter((s) => Number.isFinite(s._ms))
      .sort((a, b) => (b._ms as number) - (a._ms as number));

    return ordered[0] || null;
  }, [sessions, hasAnyPending]);

  const heroSession =
    liveSession || nextSession || latestUnlockedSession || null;

  const heroLabel = liveSession
    ? "Live Now"
    : nextSession
      ? "Next Live Session"
      : latestUnlockedSession
        ? "Latest Unlocked Class"
        : "Class Status";

  const primaryJoinUrl = liveSession?.joinUrl || nextSession?.joinUrl || "";
  const hasJoinableSession = !!primaryJoinUrl;

  const formatSessionTime = (s: SessionDoc) => {
    const ms = toMs((s as any).startsAt);
    if (!ms) return "TBD";
    const d = new Date(ms);
    return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const openJoin = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatChatTime = (value: any) => {
    const ms = toMs(value);
    if (!ms) return "";
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNotificationTime = (value: any) => {
    const ms = toMs(value);
    if (!ms) return "Just now";
    return new Date(ms).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const markCohortMessageRead = async (message: CohortMessageDoc) => {
    if (!profile?.uid || !message?.id) return;

    const readId = buildNotificationReadId(cohortKey, message.id);
    setNotificationReads((current) => ({
      ...current,
      [readId]: { readAt: new Date() },
    }));

    try {
      await setDoc(
        doc(db, "users", profile.uid, "notificationReads", readId),
        {
          uid: profile.uid,
          cohortKey,
          messageId: message.id,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("mark cohort notification read failed:", error);
      setNotificationError(
        "We could not update read state right now. Please try again.",
      );
    }
  };

  const markAllCohortMessagesRead = async () => {
    await Promise.all(
      unreadCohortMessages.map((message) => markCohortMessageRead(message)),
    );
  };

  const sendMentorMessage = async () => {
    if (!profile || hasAnyPending) return;

    const body = mentorDraft.trim();
    if (body.length < 5) {
      setMentorError("Send a little more detail so your mentor can help.");
      return;
    }

    setMentorSending(true);
    setMentorError("");

    try {
      const sendMentorRequest = httpsCallable(functions, "sendMentorRequest");
      await sendMentorRequest({
        name: profile.fullName,
        email: profile.email,
        studentPhone: profile.phone,
        message: body,
        clientMessageId: `web_${profile.uid}_${Date.now()}`,
        contextType: "web",
        sessionId: "web-student-chat",
        sessionTitle: "General mentor chat",
        pathTitle: profile.path,
        cohortKey,
        cohortId,
        cohortLabel,
      });
      setMentorDraft("");
    } catch (error: any) {
      console.error("send mentor message failed:", error);
      setMentorError(
        error?.message ||
          "We could not send that message right now. Please try again.",
      );
    } finally {
      setMentorSending(false);
    }
  };

  const unlockedWeeks = hasAnyPending ? 0 : paidWeeks;
  const unlockedSessions = useMemo(
    () => (sessions || []).filter((s: any) => Number(s.week) <= unlockedWeeks),
    [sessions, unlockedWeeks],
  );

  const formatNaira = (n: number) => `₦${Math.max(0, n).toLocaleString()}`;

  const sessionsNavPayload = {
    cohortId,
    cohortLabel,
    cohortKey,
    path: profile?.path,
    pathId: profile?.pathId,
  };

  const goToSessions = () => setShowAllClassesModal(true);

  const getSessionWindowMs = (s: SessionDoc) => {
    const startMs =
      typeof (s as any)?.startsAt?.toMillis === "function"
        ? (s as any).startsAt.toMillis()
        : NaN;

    const endMsRaw =
      typeof (s as any)?.endsAt?.toMillis === "function"
        ? (s as any).endsAt.toMillis()
        : NaN;

    const durationMs =
      Number.isFinite(Number((s as any).durationMins)) &&
      Number((s as any).durationMins) > 0
        ? Number((s as any).durationMins) * 60 * 1000
        : 60 * 60 * 1000;

    const endMs = Number.isFinite(endMsRaw) ? endMsRaw : startMs + durationMs;

    return { startMs, endMs };
  };

  const getSessionTags = (s: SessionDoc): SessionTag[] => {
    const now = Date.now();
    const { startMs, endMs } = getSessionWindowMs(s);

    const isLive =
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      now >= startMs &&
      now <= endMs;

    const joinAvailable = !!String((s as any).joinUrl || "").trim();

    const endedRecently =
      Number.isFinite(endMs) &&
      now > endMs &&
      now - endMs <= 48 * 60 * 60 * 1000;

    const recordingSoon = endedRecently && !joinAvailable;

    const tags: SessionTag[] = [];
    if (isLive) tags.push("LIVE");
    if (joinAvailable) tags.push("JOIN LINK AVAILABLE");
    if (recordingSoon) tags.push("RECORDING SOON");
    return tags;
  };

  const tagClass = (kind: SessionTag) => {
    if (kind === "LIVE") {
      return "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 border border-teal-100 dark:border-teal-500/20";
    }
    if (kind === "JOIN LINK AVAILABLE") {
      return "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 border border-blue-100 dark:border-blue-500/20";
    }
    return "bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200 border border-orange-100 dark:border-orange-500/20";
  };

  const TagRow = ({ tags }: { tags: SessionTag[] }) => {
    if (!tags || tags.length === 0) {
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tagClass(
              "RECORDING SOON",
            )}`}
          >
            RECORDING SOON
          </span>
        </div>
      );
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tagClass(
              t,
            )}`}
          >
            {t}
          </span>
        ))}
      </div>
    );
  };

  const InlineSpinner = ({ label }: { label?: string }) => (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/70 dark:border-slate-600 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      {label ? <span className="font-bold">{label}</span> : null}
    </span>
  );

  const CohortSkeleton = () => (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/70 dark:border-slate-600 border-t-blue-900 dark:border-t-teal-400 animate-spin" />
      <span className="inline-block h-3 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </span>
  );

  const selectedWeeksClamped = Math.min(
    Math.max(1, parseInt(topUpWeeks || "1", 10) || 1),
    Math.max(1, remainingWeeks || 1),
  );

  const buildPaymentPayload = () => {
    if (!profile) return null;

    const base = {
      uid: profile.uid,
      email: profile.email,
      path: profile.path,
      pathId: profile.pathId,
      courseId: profile.courseId,

      cohortId,
      cohortLabel,
      cohortKey,

      courseDurationWeeks: totalProgramWeeks,
      weeklyRate,
    };

    if (profile.pendingPayment?.status === "Pending") {
      const pp = profile.pendingPayment;
      return {
        selectedPath: profile.path,
        userData: {
          ...base,
          weeksToCommit: Number(pp.weeks) || 1,
          originalWeeks: paidWeeks,
          isTopUp: pp.kind === "topup",
          reference: pp.reference,
        },
      };
    }

    return {
      selectedPath: profile.path,
      userData: {
        ...base,
        weeksToCommit: Math.max(1, paidWeeks || 1),
        isTopUp: false,
      },
    };
  };

  const handleContinuePayment = () => {
    const payload = buildPaymentPayload();
    if (!(payload as any)?.userData?.uid || !(payload as any)?.userData?.email)
      return;
    onNavigate("payment", payload);
  };

  const handleTopUp = () => {
    if (!profile) return;
    if (!canTopUp) {
      setIsTopUpOpen(false);
      return;
    }

    const requested = Math.max(1, parseInt(topUpWeeks || "1", 10) || 1);
    const weeks = Math.min(requested, remainingWeeks || 1);

    onNavigate("payment", {
      selectedPath: profile.path,
      userData: {
        uid: profile.uid,
        email: profile.email,
        path: profile.path,
        pathId: profile.pathId,
        courseId: profile.courseId,

        weeksToCommit: weeks,
        originalWeeks: paidWeeks,
        isTopUp: true,

        cohortId,
        cohortLabel,
        cohortKey,

        courseDurationWeeks: totalProgramWeeks,
        weeklyRate,
      },
    });

    setIsTopUpOpen(false);
  };

  if (!profile) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black text-blue-900 dark:text-white mb-2">
            Profile missing
          </h1>
          <p className="text-sm text-slate-500 mb-6">Please log in again.</p>

          <button
            onClick={onLogout}
            className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-4 rounded-2xl inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  const studentNav: Array<{
    key: StudentSection;
    label: string;
    eyebrow: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "dashboard",
      label: "Overview",
      eyebrow: "home",
      icon: <Layers3 className="w-4 h-4" />,
    },
    {
      key: "classes",
      label: "Classes",
      eyebrow: `${hasAnyPending ? 0 : sessions.length} ready`,
      icon: <Video className="w-4 h-4" />,
    },
    {
      key: "resources",
      label: "Resources",
      eyebrow: "library",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: "community",
      label: "Community",
      eyebrow: "spaces",
      icon: <Users className="w-4 h-4" />,
    },
    {
      key: "chat",
      label: "Mentor Chat",
      eyebrow: hasUnreadMentorReply ? "new reply" : "support",
      icon: <Phone className="w-4 h-4" />,
    },
    {
      key: "notifications",
      label: "Notifications",
      eyebrow: unreadNotificationCount
        ? `${unreadNotificationCount} new`
        : "updates",
      icon: <BellRing className="w-4 h-4" />,
    },
    {
      key: "badges",
      label: "Badges",
      eyebrow: `${paidWeeks} earned`,
      icon: <BadgeCheck className="w-4 h-4" />,
    },
  ];

  const dashboardSyncItems = [
    { label: "Plan", loading: courseLoading },
    { label: "Cohort", loading: cohortLoading },
    { label: "Classes", loading: sessionsLoading },
    { label: "Resources", loading: resourcesLoading },
    { label: "Community", loading: communityLoading },
    { label: "Updates", loading: cohortMessagesLoading },
    { label: "Mentor", loading: mentorLoading },
  ];

  const isDashboardSyncing = dashboardSyncItems.some((item) => item.loading);

  const goToStudentSection = (section: StudentSection) => {
    routerNavigate(studentSectionRoutes[section]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const SectionNav = () => (
    <motion.div
      variants={fadeUp}
      className="mb-6 md:mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {studentNav.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => goToStudentSection(item.key)}
              className={`min-w-[150px] rounded-[1.35rem] px-4 py-3 text-left transition-all ${
                isActive
                  ? "bg-blue-900 text-white shadow-lg dark:bg-teal-600"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-black">
                <span className="inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.key === "notifications" && unreadNotificationCount ? (
                  <span className="min-w-[1.25rem] rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                ) : null}
              </span>
              <span
                className={`mt-1 block text-[10px] font-black uppercase tracking-widest ${
                  isActive
                    ? "text-white/65"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.eyebrow}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  const ReadyState = ({
    icon,
    label,
    title,
    body,
    cta,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    title: string;
    body: string;
    cta?: string;
    onClick?: () => void;
  }) => (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-12"
    >
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200">
          {icon}
          {label}
        </div>
        <h2 className="text-3xl font-black text-blue-900 dark:text-white md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
          {body}
        </p>
        {cta && onClick ? (
          <button
            onClick={onClick}
            className="mt-8 rounded-2xl bg-blue-900 px-7 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {cta}
          </button>
        ) : null}
      </div>
    </motion.div>
  );

  const badgeMilestones = getBadgesForLength(totalProgramWeeks);
  const earnedBadgeCount = clamp(paidWeeks, 0, badgeMilestones.length);
  const activeBadge =
    badgeMilestones[Math.max(0, Math.min(earnedBadgeCount || 1, badgeMilestones.length) - 1)] ||
    badgeMilestones[0];

  const FocusedSection = () => {
    if (activeSection === "classes") {
      return (
        <motion.div
          variants={fadeUp}
          className="rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
                Classes
              </p>
              <h2 className="mt-2 text-3xl font-black text-blue-900 dark:text-white">
                Your unlocked class library
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Live sessions and recordings appear here as your payment unlocks
                more weeks.
              </p>
            </div>
            {hasAnyPending ? (
              <button
                onClick={handleContinuePayment}
                className="rounded-2xl bg-orange-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-orange-500"
              >
                Continue Payment
              </button>
            ) : null}
          </div>

          {sessionsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-[1.75rem] bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : hasAnyPending ? (
            <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
              <h3 className="font-black">Classes are waiting for payment.</h3>
              <p className="mt-2 text-sm leading-7">
                Complete your payment and your unlocked class schedule will load
                here automatically.
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="text-xl font-black text-blue-900 dark:text-white">
                No classes published yet
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                Once your cohort sessions are scheduled, they will show here
                with the live class link and class notes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sessions.map((s, index) => (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Week {s.week}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-blue-900 dark:text-white">
                        {s.title}
                      </h3>
                      <TagRow tags={getSessionTags(s)} />
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-sm font-black text-white dark:bg-teal-600">
                      W{s.week}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Schedule
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-900 dark:text-white">
                        {formatSessionTime(s)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Access
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-900 dark:text-white">
                        {s.joinUrl
                          ? "Live link ready"
                          : (s as any).recordingUrl
                            ? "Recording ready"
                            : "Link coming soon"}
                      </p>
                    </div>
                  </div>

                  {!!s.notes && (
                    <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {s.notes}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {s.joinUrl ? (
                      <button
                        onClick={() => openJoin(s.joinUrl)}
                        className="rounded-2xl bg-blue-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                      >
                        Join Class
                      </button>
                    ) : null}
                    {(s as any).recordingUrl ? (
                      <button
                        onClick={() => openJoin((s as any).recordingUrl)}
                        className="rounded-2xl bg-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-900 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                      >
                        Watch Recording
                      </button>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeSection === "resources") {
      return (
        <motion.div
          variants={fadeUp}
          className="rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8"
        >
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
              Resources
            </p>
            <h2 className="mt-2 text-3xl font-black text-blue-900 dark:text-white">
              Course resource library
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Published class materials, links, and downloads for your learning
              path.
            </p>
          </div>

          {resourcesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-[1.75rem] bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : hasAnyPending ? (
            <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
              <h3 className="font-black">Resources unlock after payment.</h3>
              <p className="mt-2 text-sm leading-7">
                Complete your payment and your published resources will appear
                here automatically.
              </p>
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="text-xl font-black text-blue-900 dark:text-white">
                No resources yet
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                Resources will appear here once they are published for your
                course or cohort.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {resource.folder || "General"} · {resource.type}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-blue-900 dark:text-white">
                        {resource.name}
                      </h3>
                    </div>
                    {resource.sessionWeek ? (
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:bg-teal-500/10 dark:text-teal-200">
                        Week {resource.sessionWeek}
                      </span>
                    ) : null}
                  </div>

                  {resource.description ? (
                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {resource.description}
                    </p>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">
                      {resource.size || "Resource"}
                    </span>
                    <button
                      onClick={() => openJoin(resource.url)}
                      className="rounded-2xl bg-blue-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      Open
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeSection === "community") {
      return (
        <motion.div
          variants={fadeUp}
          className="rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8"
        >
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
              Community
            </p>
            <h2 className="mt-2 text-3xl font-black text-blue-900 dark:text-white">
              Your community spaces
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Cohort rooms, support spaces, and group links for your learning
              path.
            </p>
          </div>

          {communityLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-[1.75rem] bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : communitySpaces.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
              <Users className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="text-xl font-black text-blue-900 dark:text-white">
                No community spaces yet
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                Spaces will appear here once they are published for your cohort
                or learning path.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {communitySpaces.map((space) => (
                <article
                  key={space.id}
                  className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />
                  <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {space.category || "Community"}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-blue-900 dark:text-white">
                      {space.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {space.description}
                    </p>
                    {space.roomUrl ? (
                      <button
                        onClick={() => openJoin(space.roomUrl)}
                        className="mt-5 rounded-2xl bg-blue-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                      >
                        {space.ctaLabel || "Open Space"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeSection === "chat") {
      return (
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/60 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
                  <MessageSquare className="h-4 w-4" />
                  Mentor Chat
                </p>
                <h2 className="mt-2 text-3xl font-black text-blue-900 dark:text-white">
                  Ask your mentor
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Send a focused question. Your mentor replies here, and the
                  same thread stays available across app sessions.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {mentorThreadMeta?.lastMessageSenderType === "admin"
                  ? "New mentor reply"
                  : mentorMessages.length
                    ? `${mentorMessages.length} message${mentorMessages.length === 1 ? "" : "s"}`
                    : "Ready"}
              </div>
            </div>
          </div>

          <div className="min-h-[420px] bg-gradient-to-b from-white to-slate-50 p-4 dark:from-slate-900 dark:to-slate-950 md:p-6">
            {hasAnyPending ? (
              <div className="flex min-h-[340px] items-center justify-center rounded-[2rem] border border-orange-100 bg-orange-50 p-8 text-center text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
                <div>
                  <Lock className="mx-auto mb-4 h-10 w-10" />
                  <h3 className="text-xl font-black">Chat unlocks after payment</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7">
                    Complete your payment to keep mentor conversations connected
                    to an active learning account.
                  </p>
                  <button
                    onClick={handleContinuePayment}
                    className="mt-6 rounded-2xl bg-orange-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-orange-500"
                  >
                    Continue Payment
                  </button>
                </div>
              </div>
            ) : mentorLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`h-20 animate-pulse rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 ${
                      item % 2 ? "mr-16" : "ml-16"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mentorError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {mentorError}
                  </div>
                ) : null}

                {mentorMessages.length === 0 ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                    <MessageSquare className="mx-auto mb-4 h-10 w-10 text-teal-500" />
                    <h3 className="text-xl font-black text-blue-900 dark:text-white">
                      Start the conversation
                    </h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                      Ask about a class, bug, assignment, or learning blocker.
                      Keep it specific so your mentor can reply clearly.
                    </p>
                  </div>
                ) : (
                  mentorMessages.map((message) => {
                    const fromAdmin = message.senderType === "admin";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                            fromAdmin
                              ? "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              : "rounded-br-md bg-blue-900 text-white dark:bg-teal-600"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-7">
                            {message.body}
                          </p>
                          <div
                            className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${
                              fromAdmin
                                ? "text-slate-400"
                                : "text-white/60"
                            }`}
                          >
                            {fromAdmin
                              ? message.senderName || "Mentor"
                              : "You"}{" "}
                            {formatChatTime(message.createdAt)
                              ? `• ${formatChatTime(message.createdAt)}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {!hasAnyPending ? (
            <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <textarea
                  value={mentorDraft}
                  onChange={(event) => setMentorDraft(event.target.value)}
                  rows={3}
                  maxLength={3000}
                  placeholder="Type your mentor question..."
                  className="min-h-[92px] flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <button
                  onClick={sendMentorMessage}
                  disabled={mentorSending || mentorDraft.trim().length < 5}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-900 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 md:min-w-[160px]"
                >
                  {mentorSending ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Text only for now. No uploads, no voice notes, no emoji picker.
              </p>
            </div>
          ) : null}
        </motion.div>
      );
    }

    if (activeSection === "notifications") {
      const hasNotifications =
        cohortMessages.length > 0 || !!mentorThreadMeta?.lastMessage;

      return (
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/60 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
                  <BellRing className="h-4 w-4" />
                  Notifications
                </p>
                <h2 className="mt-2 text-3xl font-black text-blue-900 dark:text-white">
                  Cohort updates and mentor replies
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Keep track of announcements from your cohort and replies from
                  your mentor without mixing them into support mail.
                </p>
              </div>

              <button
                type="button"
                disabled={!unreadCohortMessages.length}
                onClick={markAllCohortMessagesRead}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Mark Cohort Read
              </button>
            </div>
          </div>

          <div className="space-y-4 bg-gradient-to-b from-white to-slate-50 p-4 dark:from-slate-900 dark:to-slate-950 md:p-6">
            {notificationError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {notificationError}
              </div>
            ) : null}

            {hasUnreadMentorReply || mentorThreadMeta?.lastMessage ? (
              <article
                className={`rounded-[1.75rem] border p-5 transition ${
                  hasUnreadMentorReply
                    ? "border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white dark:bg-teal-600">
                        Mentor Chat
                      </span>
                      {hasUnreadMentorReply ? (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                          New reply
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          Read
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-black text-blue-900 dark:text-white">
                      {hasUnreadMentorReply
                        ? "Your mentor replied"
                        : "Mentor chat is up to date"}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {mentorThreadMeta?.lastMessagePreview ||
                        mentorThreadMeta?.lastMessage ||
                        "Open your mentor chat to continue the conversation."}
                    </p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {formatNotificationTime(mentorThreadMeta?.lastMessageAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStudentSection("chat")}
                    className="rounded-2xl bg-blue-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Open Chat
                  </button>
                </div>
              </article>
            ) : null}

            {cohortMessagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-[1.75rem] bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : cohortMessages.length === 0 && !hasNotifications ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <BellRing className="mx-auto mb-4 h-10 w-10 text-teal-500" />
                <h3 className="text-xl font-black text-blue-900 dark:text-white">
                  No notifications yet
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Cohort announcements and mentor replies will appear here when
                  there is something new to review.
                </p>
              </div>
            ) : (
              cohortMessages.map((message) => {
                const readId = buildNotificationReadId(cohortKey, message.id);
                const isUnread = !notificationReads[readId]?.readAt;
                const messageTime =
                  (message as any).sentAt || (message as any).createdAt;

                return (
                  <article
                    key={message.id}
                    className={`rounded-[1.75rem] border p-5 transition ${
                      isUnread
                        ? "border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white dark:bg-slate-700">
                            Cohort Update
                          </span>
                          {isUnread ? (
                            <span className="rounded-full bg-teal-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                              New
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              Read
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 text-lg font-black text-blue-900 dark:text-white">
                          {message.title}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {message.body}
                        </p>
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {formatNotificationTime(messageTime)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {isUnread ? (
                          <button
                            type="button"
                            onClick={() => markCohortMessageRead(message)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Mark Read
                          </button>
                        ) : null}
                        {message.ctaUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              void markCohortMessageRead(message);
                              openJoin(message.ctaUrl);
                            }}
                            className="rounded-2xl bg-blue-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                          >
                            {message.ctaLabel || "Open Link"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </motion.div>
      );
    }

    if (activeSection === "badges") {
      return (
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div
            className="relative overflow-hidden px-6 py-8 text-white md:px-10"
            style={{
              background: activeBadge
                ? `radial-gradient(circle at top right, ${activeBadge.color}55, transparent 35%), linear-gradient(135deg, #0f172a, #0f766e)`
                : "linear-gradient(135deg, #0f172a, #0f766e)",
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
              Weekly Badges
            </p>
            <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-7xl leading-none">
                  {activeBadge?.badge || "🌱"}
                </div>
                <h2 className="mt-5 text-4xl font-black">
                  {activeBadge?.title || "First Step"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/75">
                  {earnedBadgeCount > 0
                    ? activeBadge?.tagline
                    : "Complete your first paid week to unlock your first badge."}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/55">
                  Earned
                </p>
                <p className="mt-2 text-3xl font-black">
                  {earnedBadgeCount}/{badgeMilestones.length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-blue-900 dark:text-white">
                  All course badges
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  One badge unlocks for each paid week.
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:bg-teal-500/10 dark:text-teal-200">
                {Math.round((earnedBadgeCount / badgeMilestones.length) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {badgeMilestones.map((badge) => {
                const earned = badge.week <= earnedBadgeCount;
                return (
                  <article
                    key={`${badge.week}-${badge.title}`}
                    className={`relative overflow-hidden rounded-[1.5rem] border p-4 transition ${
                      earned
                        ? "border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950/50"
                        : "border-slate-200 bg-white opacity-70 grayscale dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    {earned ? (
                      <div
                        className="absolute inset-x-0 top-0 h-1"
                        style={{ background: badge.color }}
                      />
                    ) : null}
                    <div className="text-3xl">{badge.badge}</div>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Week {badge.week}
                    </p>
                    <h4 className="mt-1 text-sm font-black text-blue-900 dark:text-white">
                      {badge.title}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {earned ? badge.tier : "Locked"}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="py-8 md:py-10 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {/* Header */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-10 gap-6"
          >
            <div className="flex items-center gap-4 min-w-0">
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white dark:border-slate-800 shrink-0"
              >
                {profile.fullName.charAt(0)}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-teal-500" />
                </div>
              </motion.div>

              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-black text-blue-900 dark:text-white truncate">
                  Welcome, {profile.fullName.split(" ")[0]}!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                  {profile.email}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-teal-500" />
                    {cohortLoading ? <CohortSkeleton /> : cohortLabel}
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    <Layers3 className="w-3.5 h-3.5 text-blue-500" />
                    {courseLoading ? (
                      <InlineSpinner label="Loading plan…" />
                    ) : !hasCoursePricing ? (
                      "Pricing unavailable"
                    ) : (
                      <>
                        {totalProgramWeeks} weeks • ₦
                        {weeklyRate.toLocaleString()}/wk
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="self-start md:self-auto px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </motion.div>

          <SectionNav />

          {activeSection === "dashboard" && isDashboardSyncing ? (
            <motion.div
              variants={fadeUp}
              className="mb-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600 dark:text-teal-400">
                    Syncing dashboard
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Your dashboard is loading section by section. Available
                    content appears as soon as Firestore returns it.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dashboardSyncItems.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                        item.loading
                          ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200"
                          : "border-teal-100 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200"
                      }`}
                    >
                      {item.loading ? (
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {activeSection !== "dashboard" ? (
            <FocusedSection />
          ) : (
            <>
          {/* Quick stats */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 md:mb-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Progress
                </p>
                <BadgeCheck className="w-4 h-4 text-teal-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {courseLoading ? <InlineSpinner /> : `${Math.round(progressPercent)}%`}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {courseLoading
                  ? "syncing plan"
                  : `${paidWeeks} of ${totalProgramWeeks} weeks`}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Remaining
                </p>
                <TimerReset className="w-4 h-4 text-orange-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {courseLoading ? <InlineSpinner /> : remainingWeeks}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {courseLoading
                  ? "syncing access"
                  : `week${remainingWeeks === 1 ? "" : "s"} left`}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Sessions
                </p>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <p className="mt-3 text-2xl font-black text-blue-900 dark:text-white">
                {sessionsLoading ? (
                  <InlineSpinner />
                ) : hasAnyPending ? (
                  0
                ) : (
                  unlockedSessions.length
                )}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {sessionsLoading ? "syncing classes" : "unlocked classes"}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Status
                </p>
                {hasAnyPending ? (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                )}
              </div>
              <p className="mt-3 text-lg font-black text-blue-900 dark:text-white">
                {courseLoading || cohortLoading ? (
                  <InlineSpinner />
                ) : hasAnyPending ? (
                  "Pending"
                ) : (
                  "Active"
                )}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {courseLoading || cohortLoading
                  ? "syncing status"
                  : hasPendingTopUp
                    ? "top-up pending"
                    : "subscription state"}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Enrollment */}
              <motion.div
                variants={fadeUp}
                className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-100/50 dark:bg-teal-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-orange-100/30 dark:bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      <BookOpen className="w-3.5 h-3.5" />
                      Current Enrollment
                    </p>

                    <h2 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white mb-6 md:mb-8">
                      {profile.path}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      profile.status === "Complete"
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-200"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200"
                    }`}
                  >
                    {profile.status === "Complete" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock3 className="w-3.5 h-3.5" />
                    )}
                    {profile.status === "Complete"
                      ? hasPendingTopUp
                        ? "Top-up Pending"
                        : "Subscription Active"
                      : "Payment Pending"}
                  </span>
                </div>

                <div className="space-y-6 relative">
                  <div className="flex justify-between items-end gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Weekly Access Paid
                      </p>
                      <p className="text-xl md:text-2xl font-black text-blue-900 dark:text-teal-400">
                        {paidWeeks} / {totalProgramWeeks} Weeks
                      </p>
                    </div>
                    <p className="text-sm font-bold text-blue-900 dark:text-white">
                      {Math.round(progressPercent)}%
                    </p>
                  </div>

                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="mt-8 md:mt-12 p-5 md:p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative border border-blue-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <h4 className="font-bold text-blue-900 dark:text-white inline-flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500 dark:text-teal-400" />
                  {hasAnyPending
                        ? "Finish your payment"
                        : !hasCoursePricing
                          ? "Top-up unavailable"
                        : canTopUp
                          ? "Ready for more?"
                          : "You’re fully paid"}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {hasAnyPending
                        ? "You have an incomplete payment. Continue to checkout to complete it before starting a new top-up."
                        : !hasCoursePricing
                          ? courseError || "We could not confirm this course price yet. Please contact support before topping up."
                        : canTopUp
                          ? "Add more weeks to your subscription to stay in the live cohort."
                          : "You’ve reached the maximum weeks for this course."}
                    </p>
                  </div>

                  {hasAnyPending ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinuePayment}
                      className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : !hasCoursePricing ? (
                    <div className="px-6 py-3 rounded-2xl bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200 font-black text-sm whitespace-nowrap inline-flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Contact Support
                    </div>
                  ) : canTopUp ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsTopUpOpen(true)}
                      className="px-8 py-4 bg-blue-900 dark:bg-teal-600 text-white font-black rounded-2xl shadow-xl transition-transform whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                      Pay Remaining {remainingWeeks === 1 ? "Week" : "Weeks"} (
                      {remainingWeeks})
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="px-6 py-3 rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200 font-black text-sm whitespace-nowrap inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Fully Paid
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Live Class / Unlocked Sessions */}
              <motion.div
                variants={fadeUp}
                className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-100/40 dark:bg-teal-500/10 blur-2xl" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-orange-100/30 dark:bg-blue-500/10 blur-2xl" />

                <div className="relative">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <p className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                          <Video className="w-3.5 h-3.5" />
                          {heroLabel}
                        </p>

                        {!sessionsLoading &&
                          !hasAnyPending &&
                          sessions.length > 0 && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Layers3 className="w-3.5 h-3.5" />
                              {sessions.length} Class
                              {sessions.length > 1 ? "es" : ""} Unlocked
                            </span>
                          )}

                        {liveSession && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-300 border border-red-100 dark:border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>

                      {sessionsLoading ? (
                        <div className="text-slate-500 dark:text-slate-300">
                          <InlineSpinner label="Loading sessions…" />
                        </div>
                      ) : hasAnyPending ? (
                        <>
                          <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white">
                            Sessions are locked
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                            Complete your payment to unlock your class schedule,
                            class notes, and live session access.
                          </p>
                        </>
                      ) : heroSession ? (
                        <>
                          <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white leading-tight">
                            Week {heroSession.week}: {heroSession.title}
                          </h3>

                          <TagRow tags={getSessionTags(heroSession)} />

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                            <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 px-4 py-3">
                              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Schedule
                              </p>
                              <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                {formatSessionTime(heroSession)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 px-4 py-3">
                              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <BookOpen className="w-3.5 h-3.5" />
                                Track
                              </p>
                              <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                {heroSession.path}
                              </p>
                            </div>
                          </div>

                          {!!heroSession.notes && (
                            <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800 max-w-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                Class Detail
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {heroSession.notes}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl font-black text-blue-900 dark:text-white">
                            No classes published yet
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                            Your cohort is active, but no class has been
                            published yet. Once sessions are scheduled, they
                            will appear here automatically.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[220px]">
                      {hasAnyPending ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleContinuePayment}
                          className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-lg transition inline-flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Continue to Payment
                        </motion.button>
                      ) : sessions.length > 0 ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={goToSessions}
                            className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition bg-blue-900 dark:bg-teal-600 text-white shadow-lg hover:opacity-95 inline-flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            View All Classes
                          </motion.button>

                          {hasJoinableSession ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openJoin(primaryJoinUrl)}
                              className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition bg-teal-600 text-white hover:bg-teal-500 shadow-lg inline-flex items-center justify-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              {liveSession
                                ? "Join Live Class"
                                : "Open Next Class"}
                            </motion.button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-8" id="unlocked-sessions">
                    {sessionsLoading ? null : hasAnyPending ? (
                      <div className="p-6 rounded-3xl bg-orange-50/60 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10">
                        <div className="font-black text-blue-900 dark:text-white text-lg inline-flex items-center gap-2">
                          <Lock className="w-5 h-5 text-orange-500" />
                          Sessions are locked
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                          Your payment is pending. Once it’s completed, your
                          unlocked sessions will appear here and you’ll be able
                          to join live classes.
                        </p>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-6 rounded-3xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          No unlocked sessions yet. Once sessions are published
                          for your cohort, they’ll show here.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Quick Preview
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {Math.min(5, sessions.length)} of{" "}
                            {sessions.length}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <AnimatePresence initial={false}>
                            {sessions.slice(0, 5).map((s, index) => (
                              <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.04 }}
                                className="group p-5 rounded-[1.75rem] bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 hover:shadow-lg transition"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base font-black text-blue-900 dark:text-white">
                                      Week {s.week}: {s.title}
                                    </p>

                                    <TagRow tags={getSessionTags(s)} />

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <Clock3 className="w-3.5 h-3.5" />
                                          Time
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {formatSessionTime(s)}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <BookOpen className="w-3.5 h-3.5" />
                                          Track
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {s.path}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 px-4 py-3">
                                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <Video className="w-3.5 h-3.5" />
                                          Access
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                          {s.joinUrl
                                            ? "Join available"
                                            : "Link coming soon"}
                                        </p>
                                      </div>
                                    </div>

                                    {!!s.notes && (
                                      <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-900/40 border border-blue-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                          Class Detail
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {s.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {s.joinUrl ? (
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[170px]">
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openJoin(s.joinUrl)}
                                        className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-900 dark:bg-teal-600 text-white hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                                      >
                                        <PlayCircle className="w-3.5 h-3.5" />
                                        Join Class
                                      </motion.button>
                                    </div>
                                  ) : null}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {sessions.length > 5 && (
                          <div className="mt-5 flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={goToSessions}
                              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-white hover:opacity-90 transition inline-flex items-center gap-2"
                            >
                              See Remaining {sessions.length - 5} Classes
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              variants={fadeUp}
              className="space-y-6 md:space-y-8 lg:sticky lg:top-6"
            >
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.25rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-blue-900 dark:text-white mb-6 uppercase tracking-widest inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-500" />
                  Your Plan
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                    <span className="text-slate-400 inline-flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Joined
                    </span>
                    <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                      {joinedDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-center gap-4 text-sm">
                    <span className="text-slate-400 inline-flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </span>
                    <span className="font-bold text-blue-900 dark:text-slate-200 text-right">
                      {profile.phone}
                    </span>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-start gap-4 text-sm">
                    <span className="text-slate-400 pt-0.5 inline-flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Cohort
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-blue-900 dark:text-slate-200 leading-tight">
                        {cohortLoading ? (
                          <span className="inline-flex items-center justify-end gap-2">
                            <InlineSpinner label="Loading cohort…" />
                          </span>
                        ) : (
                          cohortLabel
                        )}
                      </div>
                      {!cohortLoading && cohortId !== "CWG-DEFAULT" && (
                        <div className="mt-1 text-[11px] font-mono text-slate-400">
                          {cohortId}
                        </div>
                      )}
                    </div>
                  </div>

                  {remainingWeeks > 0 && !hasAnyPending && hasCoursePricing && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="mt-6 rounded-2xl border p-4 bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-slate-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Next payment due
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/70 dark:bg-slate-800/60">
                          {remainingWeeks} wk{remainingWeeks === 1 ? "" : "s"}{" "}
                          left
                        </span>
                      </div>

                      <p className="text-sm font-bold mt-3">
                        {formatNaira(remainingWeeks * weeklyRate)} •{" "}
                        {remainingWeeks} week(s)
                      </p>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        Top up anytime to keep access active.
                      </p>
                    </motion.div>
                  )}

                  {profile.pendingPayment?.status === "Pending" && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="mt-6 rounded-2xl border p-4 bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Pending Payment
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
                          {profile.pendingPayment.kind === "topup"
                            ? "Top-up"
                            : "Initial"}
                        </span>
                      </div>

                      <p className="text-sm font-bold mt-3">
                        {profile.pendingPayment.weeks} week(s) • ₦
                        {Number(profile.pendingPayment.amount).toLocaleString()}
                      </p>

                      <p className="mt-2 text-[11px] font-mono opacity-90 break-all">
                        {profile.pendingPayment.reference}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
            </>
          )}
        </motion.div>
        <AnimatePresence>
          {showAllClassesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.985 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-6xl h-[88vh] rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
              >
                <div className="relative border-b border-gray-100 dark:border-slate-800 px-5 md:px-7 py-5 md:py-6 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                  <div className="absolute -top-12 right-10 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                        <BookOpen className="w-3.5 h-3.5" />
                        Available Classes
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black text-blue-900 dark:text-white tracking-tight">
                        Your Unlocked Classes
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {sessions.length} class{sessions.length > 1 ? "es" : ""}{" "}
                        available in your learning path.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAllClassesModal(false)}
                      className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                      aria-label="Close classes modal"
                    >
                      <svg
                        className="w-5 h-5"
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
                  </div>
                </div>

                <div className="h-[calc(88vh-112px)] overflow-auto px-5 md:px-7 py-5 md:py-6 bg-slate-50/70 dark:bg-slate-950/60">
                  {sessions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="max-w-md text-center">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-5">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <h4 className="text-xl font-black text-blue-900 dark:text-white mb-2">
                          No classes available yet
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                          Once sessions are published for your cohort, they’ll
                          appear here automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                      <AnimatePresence initial={false}>
                        {sessions.map((s, index) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="group rounded-[1.75rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-lg shrink-0">
                                    W{s.week}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-lg font-black text-blue-900 dark:text-white leading-tight">
                                      {s.title}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                      Week {s.week}
                                    </p>
                                  </div>
                                </div>

                                <TagRow tags={getSessionTags(s)} />
                              </div>

                              {s.joinUrl ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => openJoin(s.joinUrl)}
                                  className="shrink-0 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-900 dark:bg-teal-600 text-white hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  Join
                                </motion.button>
                              ) : null}
                            </div>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-3">
                                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  Schedule
                                </p>
                                <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                  {formatSessionTime(s)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-3">
                                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Track
                                </p>
                                <p className="text-sm font-bold text-blue-900 dark:text-white mt-1">
                                  {s.path}
                                </p>
                              </div>
                            </div>

                            {!!s.notes && (
                              <div className="mt-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  Class Detail
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {s.notes}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Up Modal */}
        <AnimatePresence>
          {isTopUpOpen && canTopUp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-teal-500/10 text-blue-900 dark:text-teal-300 flex items-center justify-center mb-5">
                  <CreditCard className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">
                  Extend Your Access
                </h3>

                <div className="space-y-4 mb-8">
                  <select
                    value={topUpWeeks}
                    onChange={(e) => setTopUpWeeks(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
                      .filter((w) => w <= remainingWeeks)
                      .map((w) => (
                        <option key={w} value={String(w)}>
                          {w} {w === 1 ? "Week" : "Weeks"} (₦
                          {(w * weeklyRate).toLocaleString()})
                        </option>
                      ))}
                  </select>

                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Total Due
                    </span>
                    <span className="text-2xl font-black text-teal-600 inline-flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />₦
                      {(selectedWeeksClamped * weeklyRate).toLocaleString()}
                    </span>
                  </div>

                  {remainingWeeks > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                      Remaining:{" "}
                      <span className="font-bold">{remainingWeeks}</span>{" "}
                      week(s)
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsTopUpOpen(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTopUp}
                    className="flex-1 py-4 bg-blue-900 dark:bg-teal-600 text-white font-bold rounded-2xl shadow-lg inline-flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentDashboard;
