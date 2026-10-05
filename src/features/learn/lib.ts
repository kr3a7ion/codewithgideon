import type { SessionDoc } from "../../../services/registrationStore";

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
export type StudentSection =
  | "dashboard"
  | "classes"
  | "resources"
  | "community"
  | "chat"
  | "notifications"
  | "badges"
  | "account"
  | "more";

export const studentSectionRoutes: Record<StudentSection, string> = {
  dashboard: "/student/dashboard",
  classes: "/student/classes",
  resources: "/student/resources",
  community: "/student/community",
  chat: "/student/chat",
  notifications: "/student/notifications",
  badges: "/student/badges",
  account: "/student/account",
  more: "/student/more",
};

export const sectionFromPathname = (pathname: string): StudentSection => {
  const match = String(pathname || "").match(/^\/student\/([a-z]+)/);
  const key = match?.[1] as StudentSection | undefined;
  return key && key in studentSectionRoutes ? key : "dashboard";
};

// ---------------------------------------------------------------------------
// Numbers, dates, links
// ---------------------------------------------------------------------------
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const parsePricePerWeek = (label: string, fallback = 0) => {
  const s = String(label || "").toLowerCase();
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return s.includes("k") ? num * 1000 : num;
};

/** Accepts Firestore Timestamps, Dates, ms numbers, ISO strings. */
export const toMs = (v: any): number | null => {
  if (!v) return null;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "object" && typeof v.seconds === "number") return v.seconds * 1000;
  return null;
};

export const formatNaira = (n: number) => `₦${Math.max(0, Number(n) || 0).toLocaleString()}`;

export const formatSessionTime = (s: SessionDoc) => {
  const ms = toMs((s as any).startsAt);
  if (!ms) return "Time to be announced";
  return new Date(ms).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatChatTime = (value: any) => {
  const ms = toMs(value);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatRelativeDate = (value: any) => {
  const ms = toMs(value);
  if (!ms) return "Just now";
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const openExternal = (url?: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export type SessionTag = "LIVE" | "JOIN LINK AVAILABLE" | "RECORDING SOON";

export const sessionWindow = (s: SessionDoc) => {
  const startMs = toMs((s as any).startsAt) ?? NaN;
  const endRaw = toMs((s as any).endsAt);
  const minutes = Number((s as any).durationMins);
  const durationMs = Number.isFinite(minutes) && minutes > 0 ? minutes * 60_000 : 60 * 60_000;
  const endMs = endRaw ?? (Number.isFinite(startMs) ? startMs + durationMs : NaN);
  return { startMs, endMs };
};

export const isLiveNow = (s: SessionDoc, now = Date.now()) => {
  const { startMs, endMs } = sessionWindow(s);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && now >= startMs && now <= endMs;
};

export const getSessionTags = (s: SessionDoc): SessionTag[] => {
  const now = Date.now();
  const { endMs } = sessionWindow(s);
  const joinAvailable = !!String((s as any).joinUrl || "").trim();
  const hasRecording = !!String((s as any).recordingUrl || "").trim();
  const endedRecently =
    Number.isFinite(endMs) && now > endMs && now - endMs <= 48 * 60 * 60 * 1000;

  const tags: SessionTag[] = [];
  if (isLiveNow(s, now)) tags.push("LIVE");
  if (joinAvailable) tags.push("JOIN LINK AVAILABLE");
  if (endedRecently && !hasRecording) tags.push("RECORDING SOON");
  return tags;
};

// ---------------------------------------------------------------------------
// Ids shared with mobile + Cloud Functions
// ---------------------------------------------------------------------------
export const buildMentorThreadId = (studentUid: string) =>
  `mentor_${String(studentUid || "").trim().replace(/[^a-zA-Z0-9._-]+/g, "_")}`;

export const buildNotificationReadId = (cohortKey: string, messageId: string) =>
  `${String(cohortKey || "cohort").trim().replace(/[^a-zA-Z0-9._-]+/g, "_")}_${String(
    messageId || "message",
  )
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")}`;

// ---------------------------------------------------------------------------
// Weekly badges (same set as the mobile app)
// ---------------------------------------------------------------------------
export type JourneyBadge = {
  badge: string;
  title: string;
  tagline: string;
  color: string;
  tier: string;
  week: number;
};

const allJourneyBadges: Omit<JourneyBadge, "week">[] = [
  { badge: "🌱", title: "First Step", tagline: "You showed up. That is everything.", color: "#4ade80", tier: "Starter" },
  { badge: "🔥", title: "On Fire", tagline: "Momentum is building. Keep it up.", color: "#fb923c", tier: "Ignited" },
  { badge: "⚡", title: "Live Wire", tagline: "You are in the zone. Keep sparking.", color: "#facc15", tier: "Charged" },
  { badge: "🏅", title: "One Month Strong", tagline: "A full month. You are built different.", color: "#c084fc", tier: "Milestone" },
  { badge: "💪", title: "Crushing It", tagline: "Look at you go. No slowing down.", color: "#f472b6", tier: "Crusher" },
  { badge: "🌊", title: "Halfway Hero", tagline: "Past the midpoint. You are doing this.", color: "#38bdf8", tier: "Midpoint" },
  { badge: "🎯", title: "Locked In", tagline: "Focused. Consistent. Unstoppable.", color: "#fb7185", tier: "Focused" },
  { badge: "🦅", title: "Soaring", tagline: "Flying high. Nothing stopping you now.", color: "#818cf8", tier: "Elevated" },
  { badge: "💎", title: "Diamond Grit", tagline: "Pressure makes diamonds. You are proof.", color: "#67e8f9", tier: "Diamond" },
  { badge: "🚀", title: "Launch Mode", tagline: "Final stretch. You are in launch mode.", color: "#a78bfa", tier: "Launch" },
  { badge: "⭐", title: "Almost Legendary", tagline: "One step left. Leave nothing behind.", color: "#fbbf24", tier: "Legend" },
  { badge: "🏆", title: "Champion", tagline: "You did it. Every single week. Champion.", color: "#f59e0b", tier: "Champion" },
];

export const getBadgesForLength = (totalWeeks: number): JourneyBadge[] => {
  const safeWeeks = Math.max(1, Math.floor(Number(totalWeeks || 1)));
  if (safeWeeks === 1) return [{ ...allJourneyBadges[11], week: 1 }];
  if (safeWeeks >= 12) return allJourneyBadges.map((b, i) => ({ ...b, week: i + 1 }));

  const indices = [0];
  const middleCount = safeWeeks - 2;
  for (let i = 0; i < middleCount; i += 1) {
    indices.push(Math.min(Math.round(1 + ((i + 1) * 10) / (middleCount + 1)), 10));
  }
  indices.push(11);
  return [...new Set(indices)].map((idx, i) => ({ ...allJourneyBadges[idx], week: i + 1 }));
};
