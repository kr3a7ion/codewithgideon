/* Admin helpers, types and shared class names (moved from AdminDashboard.tsx). */
import React from "react";
import type { View } from "../../app/views";
import { SyllabusWeek } from "../../../services/registrationStore";
import { auth } from "../../../services/firebase";
export interface AdminDashboardProps {
  onNavigate: (view: View) => void;
  onLogout: () => void;
  sessionRemainingMs?: number;
}

export const getCohortDocId = (c: any) => String(c?.id || "").trim();
export const getCohortKey = (c: any) => String(c?.cohortKey || "").trim();

// optional: pick cohort by cohortKey (when you only have cohortKey)
export const findCohortDocIdByKey = (list: any[], cohortKey: string) => {
  const key = String(cohortKey || "").trim();
  if (!key) return "";
  const hit = (list || []).find(
    (c) => String(c?.cohortKey || "").trim() === key,
  );
  return hit ? String(hit.id) : "";
};
export type ContactMessageDoc = {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  studentName?: string;
  studentEmail?: string;
  studentUid?: string;
  studentPhone?: string;
  sessionId?: string;
  sessionTitle?: string;
  pathTitle?: string;
  lastMessage?: string;
  lastMessagePreview?: string;
  lastMessageAt?: any;
  lastMessageId?: string;
  lastMessageSenderType?: string;
  lastMessageSenderName?: string;
  lastMessageSenderEmail?: string;
  status?: string;
  source?: string;
  category?: string;
  channel?: string;
  threadType?: string;
  threadCollection?: "mentorThreads" | "contactMessages";
  createdAt?: any;
  updatedAt?: any;
  repliedAt?: any;
  fullName?: string;
  senderName?: string;
  senderEmail?: string;
  uid?: string;
  auth?: {
    uid?: string | null;
  };
  appCheck?: {
    appId?: string | null;
  };
};

export type InboxThreadMessage = {
  id: string;
  body: string;
  senderType: "user" | "admin" | "system";
  senderName: string;
  senderEmail?: string;
  createdAt?: any;
  source?: string;
};

export const formatSessionCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const paymentRecordAmount = (payment: PaymentRecordDoc) => {
  const amountKobo = Number(payment.amountKobo || 0);
  return amountKobo > 0
    ? Math.round(amountKobo / 100)
    : Math.max(0, Number(payment.amount || 0));
};

export type PaymentRecordDoc = {
  id: string;
  userId: string;
  uid?: string;
  reference?: string;
  kind?: string;
  weeks?: number;
  amount?: number;
  amountKobo?: number;
  chargedAmountKobo?: number;
  baseAmountKobo?: number;
  gatewayFeeKobo?: number | null;
  email?: string | null;
  path?: string;
  pathId?: string | null;
  courseId?: string | null;
  cohortLabel?: string | null;
  cohortKey?: string | null;
  verifiedAt?: any;
  timestamp?: any;
  paystack?: {
    id?: string | number | null;
    status?: string | null;
    currency?: string | null;
    paidAt?: string | null;
    channel?: string | null;
  } | null;
};

export type AdminNotice = {
  tone: "info" | "success" | "error";
  message: string;
};

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "danger" | "warning" | "info";
  resolve: (confirmed: boolean) => void;
};

export type CourseForm = {
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

export const emptyCourse: CourseForm = {
  pathId: "",

  title: "",
  duration: "4 Weeks",
  sessions: "2× Weekly",
  level: "Beginner",
  description: "",
  priceLabel: "",
  imageUrl: "",
  syllabusView: "",

  isActive: true,
  showOnLanding: true,
  showInExplore: true,

  weeks: 4,
  pricePerWeek: 0,
  syllabus: [{ week: 1, title: "Introduction", topics: ["Overview", "Setup"] }],
};

export type SessionForm = {
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

export const emptySession: SessionForm = {
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

export const toLocalDateInput = (ms: number) => {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const toLocalTimeInput = (ms: number) => {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const combineDateTimeToMs = (date: string, time: string) => {
  const [yyyy, mm, dd] = date.split("-").map((x) => parseInt(x, 10));
  const [hh, min] = time.split(":").map((x) => parseInt(x, 10));
  if (!yyyy || !mm || !dd) return Date.now();
  const d = new Date(yyyy, mm - 1, dd, hh || 0, min || 0, 0, 0);
  return d.getTime();
};

export const sessionTimeToMs = (t: any) => {
  if (!t) return Date.now();
  if (typeof t === "number") return t;
  if (typeof t === "string") {
    const n = Date.parse(t);
    return Number.isFinite(n) ? n : Date.now();
  }
  if (typeof t?.toMillis === "function") return t.toMillis();
  return Date.now();
};
export const toDateMs = (v: any): number => {
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

export const formatInboxDate = (v: any) => {
  const ms = toDateMs(v);
  if (!ms) return "Unknown date";
  return new Date(ms).toLocaleString();
};

export const getInboxActivityMs = (message: any) =>
  toDateMs(
    message?.updatedAt ||
      message?.lastMessageAt ||
      message?.repliedAt ||
      message?.createdAt,
  );

export const getInboxMessageBody = (message: any) =>
  String(
    message?.body ||
      message?.message ||
      message?.text ||
      message?.content ||
      message?.lastMessagePreview ||
      message?.lastMessage ||
      "",
  ).trim();

export const getInboxDisplayName = (message: any) =>
  String(
    message?.studentName ||
      message?.name ||
      message?.fullName ||
      message?.lastMessageSenderName ||
      message?.senderName ||
      message?.displayName ||
      "",
  ).trim() || "Unknown sender";

export const getInboxEmail = (message: any) =>
  String(
    message?.studentEmail ||
      message?.email ||
      message?.lastMessageSenderEmail ||
      message?.senderEmail ||
      "",
  ).trim();

export const getInboxSourceLabel = (message: any) => {
  const channel = String(message?.channel || message?.threadType || "")
    .trim()
    .toLowerCase();
  if (channel.includes("mobile") || channel.includes("mentor")) {
    return "mobile-app-chat";
  }

  const source = String(message?.source || "").trim().toLowerCase();
  if (!source) return "mobile-app-chat";
  if (source.includes("mobile")) return "mobile-app-chat";
  if (source.includes("web")) return source;
  return source;
};

export const getInboxPreview = (message: any) =>
  getInboxMessageBody(message) || "No message";

export const isMentorContactMessage = (message: any) => {
  const category = String(message?.category || "").toLowerCase();
  const source = String(message?.source || "").toLowerCase();
  const channel = String(message?.channel || "").toLowerCase();
  const threadType = String(message?.threadType || "").toLowerCase();

  return (
    category === "ask-mentor" ||
    source.includes("mobile-ask-mentor") ||
    channel === "mobile_chat" ||
    threadType.includes("mentor")
  );
};

export const isUnreadLearnerChat = (message: any) =>
  String(message?.status || "new").toLowerCase() === "new" &&
  !isAdminInboxMessage(message);

export const getInboxThreadCollection = (message: ContactMessageDoc | null) =>
  message?.threadCollection === "contactMessages"
    ? "contactMessages"
    : "mentorThreads";

export const isAdminInboxMessage = (message: any) => {
  const senderType = String(
    message?.lastMessageSenderType ||
      message?.senderType ||
      message?.senderRole ||
      message?.role ||
      "",
  ).toLowerCase();
  const source = String(message?.source || "").toLowerCase();
  const sentBy = String(message?.sentBy || "").toLowerCase();

  return (
    senderType === "admin" ||
    source === "admin-dashboard" ||
    sentBy === "admin"
  );
};

export const normalizeInboxThreadMessage = (
  raw: any,
  fallbackId: string,
): InboxThreadMessage | null => {
  const body = getInboxMessageBody(raw);
  if (!body) return null;

  return {
    id: String(raw?.id || fallbackId),
    body,
    senderType: isAdminInboxMessage(raw) ? "admin" : "user",
    senderName: getInboxDisplayName(raw),
    senderEmail: getInboxEmail(raw) || undefined,
    createdAt: raw?.createdAt || raw?.sentAt || raw?.timestamp || null,
    source: raw?.source,
  };
};

export const sortInboxMessagesByActivity = (messages: ContactMessageDoc[]) =>
  [...messages].sort((a, b) => {
    const activityDelta = getInboxActivityMs(b) - getInboxActivityMs(a);
    if (activityDelta !== 0) return activityDelta;
    return toDateMs(b.createdAt) - toDateMs(a.createdAt);
  });

export const mergeInboxThreadEntries = (
  entries: InboxThreadMessage[],
): InboxThreadMessage[] =>
  entries
    .filter((entry, index, list) => {
      const entryName = String(entry.senderName || "").trim().toLowerCase();
      const entryTime = toDateMs(entry.createdAt);

      return (
        list.findIndex((candidate) => {
          if (candidate.id === entry.id) return true;

          const candidateName = String(candidate.senderName || "")
            .trim()
            .toLowerCase();
          const candidateTime = toDateMs(candidate.createdAt);

          return (
            candidate.body === entry.body &&
            candidate.senderType === entry.senderType &&
            candidateName === entryName &&
            Math.abs(candidateTime - entryTime) <= 5000
          );
        }) === index
      );
    })
    .sort((a, b) => toDateMs(a.createdAt) - toDateMs(b.createdAt));
