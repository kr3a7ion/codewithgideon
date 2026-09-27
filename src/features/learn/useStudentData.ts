import { useCallback, useEffect, useMemo, useState } from "react";
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
import { db, functions } from "../../../services/firebase";
import {
  registrationStore,
  type CohortMessageDoc,
  type CommunitySpaceDoc,
  type CourseDoc,
  type RegistrationEntry,
  type ResourceDoc,
  type SessionDoc,
} from "../../../services/registrationStore";
import {
  buildMentorThreadId,
  buildNotificationReadId,
  clamp,
  isLiveNow,
  parsePricePerWeek,
  parseWeeksFromDuration,
  toMs,
  type StudentSection,
} from "./lib";

export type MentorChatMessage = {
  id: string;
  body: string;
  senderType: "user" | "admin" | "system";
  senderName?: string;
  senderEmail?: string;
  createdAt?: any;
};

type NotificationReadMap = Record<string, { readAt?: any }>;

type ActiveCohort = { cohortId: string; cohortKey: string; label: string };

/**
 * Everything the student area shows, loaded section by section so each part
 * appears as soon as Firestore returns it. Semantics match the security
 * rules: only an unpaid first enrolment locks content; a pending top-up
 * never hides weeks the student already paid for.
 */
export const useStudentData = (
  profile: RegistrationEntry | null,
  activeSection: StudentSection,
) => {
  const uid = profile?.uid || "";

  // ---------------- cohort (display fallback only) ----------------
  const [activeForPath, setActiveForPath] = useState<ActiveCohort | null>(null);
  const [cohortLoading, setCohortLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!uid || !profile?.path) {
      setCohortLoading(false);
      return;
    }
    setCohortLoading(true);
    (async () => {
      try {
        const pathId =
          profile.pathId || (await registrationStore.resolvePathId(profile.path));
        const active = pathId
          ? await registrationStore.getActiveCohortForPathId(pathId)
          : await registrationStore.getActiveCohortForPath(profile.path);
        // Never written back: a student's cohort is assigned when they pay.
        if (mounted) {
          setActiveForPath({
            cohortId: active.cohortId,
            cohortKey: active.cohortKey,
            label: active.label,
          });
        }
      } catch {
        if (mounted) setActiveForPath(null);
      } finally {
        if (mounted) setCohortLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, profile?.path, profile?.pathId]);

  const cohortId = profile?.cohortId || activeForPath?.cohortId || "";
  const cohortKey = profile?.cohortKey || activeForPath?.cohortKey || "";
  const cohortLabel = profile?.cohortLabel || activeForPath?.label || "Current cohort";

  // ---------------- course pricing ----------------
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseMaxWeeks, setCourseMaxWeeks] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!profile?.path) {
      setCourseLoading(false);
      return;
    }
    setCourseLoading(true);
    setCourseError("");

    const applyProfileFallback = () => {
      const weeks = Number(profile.courseDurationWeeks || 0);
      const rate = Number(profile.weeklyRate || 0);
      if (weeks > 0) setCourseMaxWeeks(weeks);
      if (rate > 0) setWeeklyRate(rate);
      if (!(weeks > 0 && rate > 0)) {
        setCourseError(
          "We couldn't load your course price. Please contact support before topping up.",
        );
      }
    };

    (async () => {
      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c: any) => c.isActive !== false);
        const found: any = active.find((c: any) => {
          if (profile.courseId) return String(c.id) === String(profile.courseId);
          if (profile.pathId && c.pathId) return String(c.pathId) === String(profile.pathId);
          return (
            String(c.title || "").trim().toLowerCase() ===
            String(profile.path || "").trim().toLowerCase()
          );
        });
        if (!mounted) return;
        if (found) {
          const w = Number(found.weeks);
          const p = Number(found.pricePerWeek);
          const weeks = w > 0 ? Math.floor(w) : parseWeeksFromDuration(found.duration || "4", 4);
          const rate = p > 0 ? Math.floor(p) : parsePricePerWeek(found.priceLabel || "", 0);
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
        if (mounted) applyProfileFallback();
      } finally {
        if (mounted) setCourseLoading(false);
      }
    })();

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

  // ---------------- enrolment state ----------------
  const isEnrolled = profile?.status === "Complete";
  const isLocked = !isEnrolled;
  // Before the first payment, weeksToCommit is only the number of weeks the
  // student intends to buy, so nothing counts as paid yet.
  const intendedWeeks = Math.max(1, Number(profile?.weeksToCommit || 1));
  const paidWeeks = isEnrolled ? Math.max(0, Number(profile?.weeksToCommit || 0)) : 0;
  const totalProgramWeeks = Math.max(1, Number(courseMaxWeeks || 1));
  const hasCoursePricing = courseMaxWeeks > 0 && weeklyRate > 0 && !courseError;
  const progressPercent = clamp((paidWeeks / totalProgramWeeks) * 100, 0, 100);
  const remainingWeeks = Math.max(0, totalProgramWeeks - paidWeeks);
  const canTopUp = isEnrolled && hasCoursePricing && remainingWeeks > 0;
  const pendingPayment =
    profile?.pendingPayment?.status === "Pending" ? profile.pendingPayment : null;
  const hasPendingTopUp = pendingPayment?.kind === "topup";

  // ---------------- sessions ----------------
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!profile?.uid) return;
    setSessionsLoading(true);
    registrationStore
      .getUnlockedSessionsForStudent(profile)
      .then((list) => mounted && setSessions(list || []))
      .catch(() => mounted && setSessions([]))
      .finally(() => mounted && setSessionsLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.uid,
    profile?.status,
    profile?.pathId,
    profile?.path,
    profile?.cohortKey,
    profile?.cohortId,
    profile?.weeksToCommit,
  ]);

  // ---------------- resources ----------------
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!profile?.uid) return;
    if (profile.status !== "Complete") {
      setResources([]);
      setResourcesLoading(false);
      return;
    }
    setResourcesLoading(true);
    const paidWeekLimit = Math.max(0, Number(profile.weeksToCommit || 0));
    registrationStore
      .getPublishedResources()
      .then((list) => {
        if (!mounted) return;
        const visible = (list || [])
          .filter((r: any) => r.isPublished !== false)
          .filter((r: any) => {
            const courseId = String(r.courseId || "").trim();
            const pathId = String(r.pathId || "").trim();
            if (courseId && profile.courseId && courseId !== String(profile.courseId)) return false;
            if (pathId && profile.pathId && pathId !== String(profile.pathId)) return false;
            const week = Number(r.sessionWeek || 0);
            return !Number.isFinite(week) || week <= 0 || week <= paidWeekLimit;
          })
          .sort((a: any, b: any) => {
            const byWeek = Number(a.sessionWeek || 999) - Number(b.sessionWeek || 999);
            return byWeek !== 0 ? byWeek : Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
          });
        setResources(visible);
      })
      .catch(() => mounted && setResources([]))
      .finally(() => mounted && setResourcesLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.status, profile?.weeksToCommit, profile?.pathId, profile?.courseId]);

  // ---------------- community spaces ----------------
  const [communitySpaces, setCommunitySpaces] = useState<CommunitySpaceDoc[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!profile?.uid) return;
    setCommunityLoading(true);
    const activeCohortId = profile.cohortId || activeForPath?.cohortId || "";
    registrationStore
      .getPublishedCommunitySpaces()
      .then((list) => {
        if (!mounted) return;
        setCommunitySpaces(
          (list || [])
            .filter((s: any) => s.isPublished !== false)
            .filter((s: any) => {
              const pathId = String(s.pathId || "").trim();
              const spaceCohort = String(s.cohortId || "").trim();
              if (pathId && profile.pathId && pathId !== String(profile.pathId)) return false;
              if (spaceCohort && activeCohortId && spaceCohort !== String(activeCohortId)) return false;
              return true;
            }),
        );
      })
      .catch(() => mounted && setCommunitySpaces([]))
      .finally(() => mounted && setCommunityLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.pathId, profile?.cohortId, activeForPath?.cohortId]);

  // ---------------- cohort announcements + read state ----------------
  const [cohortMessages, setCohortMessages] = useState<CohortMessageDoc[]>([]);
  const [cohortMessagesLoading, setCohortMessagesLoading] = useState(true);
  const [notificationReads, setNotificationReads] = useState<NotificationReadMap>({});
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    if (!uid) {
      setNotificationReads({});
      return;
    }
    return onSnapshot(
      collection(db, "users", uid, "notificationReads"),
      (snap) => {
        const next: NotificationReadMap = {};
        snap.docs.forEach((d) => {
          next[d.id] = d.data() as { readAt?: any };
        });
        setNotificationReads(next);
      },
      (error) => {
        console.error("notification reads subscription failed:", error);
        setNotificationReads({});
      },
    );
  }, [uid]);

  useEffect(() => {
    if (!uid || !cohortKey) {
      setCohortMessages([]);
      setCohortMessagesLoading(false);
      return;
    }
    setCohortMessagesLoading(true);
    setNotificationError("");
    return onSnapshot(
      query(collection(db, "cohorts", cohortKey, "messages"), orderBy("createdAt", "desc"), limit(30)),
      (snap) => {
        setCohortMessages(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CohortMessageDoc[],
        );
        setCohortMessagesLoading(false);
      },
      (error) => {
        console.error("cohort announcements subscription failed:", error);
        setCohortMessages([]);
        setCohortMessagesLoading(false);
        setNotificationError("We couldn't load cohort updates. Please refresh and try again.");
      },
    );
  }, [uid, cohortKey]);

  const isMessageUnread = useCallback(
    (message: CohortMessageDoc) =>
      !notificationReads[buildNotificationReadId(cohortKey, message.id)]?.readAt,
    [notificationReads, cohortKey],
  );

  const unreadCohortMessages = useMemo(
    () => cohortMessages.filter(isMessageUnread),
    [cohortMessages, isMessageUnread],
  );

  const markCohortMessageRead = useCallback(
    async (message: CohortMessageDoc) => {
      if (!uid || !message?.id) return;
      const readId = buildNotificationReadId(cohortKey, message.id);
      setNotificationReads((current) => ({ ...current, [readId]: { readAt: new Date() } }));
      try {
        await setDoc(
          doc(db, "users", uid, "notificationReads", readId),
          {
            uid,
            cohortKey,
            messageId: message.id,
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("mark announcement read failed:", error);
        setNotificationError("We couldn't update read state. Please try again.");
      }
    },
    [uid, cohortKey],
  );

  const markAllCohortMessagesRead = useCallback(async () => {
    await Promise.all(unreadCohortMessages.map((m) => markCohortMessageRead(m)));
  }, [unreadCohortMessages, markCohortMessageRead]);

  // ---------------- mentor chat ----------------
  const mentorThreadId = uid ? buildMentorThreadId(uid) : "";
  const [mentorMessages, setMentorMessages] = useState<MentorChatMessage[]>([]);
  const [mentorThreadMeta, setMentorThreadMeta] = useState<Record<string, any> | null>(null);
  const [mentorLoading, setMentorLoading] = useState(true);
  const [mentorError, setMentorError] = useState("");
  const [mentorSending, setMentorSending] = useState(false);
  const isChatOpen = activeSection === "chat";

  useEffect(() => {
    if (!mentorThreadId) {
      setMentorMessages([]);
      setMentorThreadMeta(null);
      setMentorLoading(false);
      return;
    }
    setMentorLoading(true);
    setMentorError("");

    const unsubscribeThread = onSnapshot(
      doc(db, "mentorThreads", mentorThreadId),
      (snap) => setMentorThreadMeta(snap.exists() ? snap.data() : null),
      (error) => {
        console.error("mentor thread subscription failed:", error);
        setMentorThreadMeta(null);
      },
    );

    const unsubscribeMessages = onSnapshot(
      query(
        collection(db, "mentorThreads", mentorThreadId, "messages"),
        orderBy("createdAt", "asc"),
        limit(200),
      ),
      (snap) => {
        const list = snap.docs
          .map((d) => {
            const data = d.data() as Record<string, any>;
            return {
              id: d.id,
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
          })
          .filter((m) => m.body);
        setMentorMessages(list);
        setMentorLoading(false);
      },
      (error) => {
        console.error("mentor messages subscription failed:", error);
        setMentorMessages([]);
        setMentorLoading(false);
        setMentorError("We couldn't load mentor chat. Please refresh and try again.");
      },
    );

    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [mentorThreadId]);

  // Mark the mentor's reply as read while the chat is open.
  useEffect(() => {
    if (!isChatOpen || !mentorThreadId) return;
    if (mentorThreadMeta?.lastMessageSenderType !== "admin") return;
    const lastAt = toMs(mentorThreadMeta?.lastMessageAt) || 0;
    const readAt = toMs(mentorThreadMeta?.studentLastReadAt) || 0;
    if (readAt >= lastAt) return;
    updateDoc(doc(db, "mentorThreads", mentorThreadId), {
      status: "read",
      studentLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(() => {
      // Read state is a nicety; chat works without it.
    });
  }, [isChatOpen, mentorThreadId, mentorThreadMeta]);

  const hasUnreadMentorReply =
    !isChatOpen &&
    mentorThreadMeta?.lastMessageSenderType === "admin" &&
    (toMs(mentorThreadMeta?.lastMessageAt) || 0) >
      (toMs(mentorThreadMeta?.studentLastReadAt) || 0);

  const sendMentorMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!profile || isLocked) return false;
      const body = text.trim();
      if (body.length < 5) {
        setMentorError("Add a little more detail so your mentor can help.");
        return false;
      }
      setMentorSending(true);
      setMentorError("");
      try {
        await httpsCallable(functions, "sendMentorRequest")({
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
        return true;
      } catch (error: any) {
        console.error("send mentor message failed:", error);
        setMentorError(error?.message || "We couldn't send that message. Please try again.");
        return false;
      } finally {
        setMentorSending(false);
      }
    },
    [profile, isLocked, cohortKey, cohortId, cohortLabel],
  );

  // ---------------- class highlights ----------------
  const { liveSession, nextSession, latestSession } = useMemo(() => {
    if (isLocked) return { liveSession: null, nextSession: null, latestSession: null };
    const now = Date.now();
    const timed = sessions
      .map((s) => ({ s, ms: toMs((s as any).startsAt) ?? NaN }))
      .filter((x) => Number.isFinite(x.ms));
    const live = sessions.find((s) => isLiveNow(s, now)) || null;
    const next =
      timed.filter((x) => x.ms > now).sort((a, b) => a.ms - b.ms)[0]?.s || null;
    const latest = timed.sort((a, b) => b.ms - a.ms)[0]?.s || null;
    return { liveSession: live, nextSession: next, latestSession: latest };
  }, [sessions, isLocked]);

  const unreadNotificationCount =
    unreadCohortMessages.length + (hasUnreadMentorReply ? 1 : 0);

  return {
    profile,
    // cohort
    cohortId,
    cohortKey,
    cohortLabel,
    cohortLoading,
    // course + enrolment
    courseLoading,
    courseError,
    weeklyRate,
    totalProgramWeeks,
    hasCoursePricing,
    isEnrolled,
    isLocked,
    paidWeeks,
    intendedWeeks,
    progressPercent,
    remainingWeeks,
    canTopUp,
    pendingPayment,
    hasPendingTopUp,
    // content
    sessions,
    sessionsLoading,
    liveSession,
    nextSession,
    latestSession,
    resources,
    resourcesLoading,
    communitySpaces,
    communityLoading,
    // announcements
    cohortMessages,
    cohortMessagesLoading,
    isMessageUnread,
    unreadCohortMessages,
    markCohortMessageRead,
    markAllCohortMessagesRead,
    notificationError,
    unreadNotificationCount,
    // mentor
    mentorMessages,
    mentorThreadMeta,
    mentorLoading,
    mentorError,
    mentorSending,
    hasUnreadMentorReply,
    sendMentorMessage,
  };
};

export type StudentData = ReturnType<typeof useStudentData>;
