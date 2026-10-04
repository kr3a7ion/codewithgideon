import type { SessionDoc } from "../../../services/registrationStore";
import { sessionWindow, toMs } from "./lib";

const MIN = 60_000;
const DAY = 86_400_000;
/** The join button appears this long before a class starts. */
export const JOIN_EARLY_MS = 15 * MIN;

const clock = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours();
  return { hm: `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`, ap: h >= 12 ? "pm" : "am" };
};

/** "7:00 pm" */
export const timeFmt = (ms: number) => {
  const c = clock(ms);
  return `${c.hm} ${c.ap}`;
};

/** "7:00 – 8:00 pm", or "11:30 am – 12:30 pm" across noon. */
export const timeRange = (startMs: number, endMs: number) => {
  if (!Number.isFinite(endMs)) return timeFmt(startMs);
  const a = clock(startMs);
  const b = clock(endMs);
  return a.ap === b.ap ? `${a.hm} – ${b.hm} ${b.ap}` : `${a.hm} ${a.ap} – ${b.hm} ${b.ap}`;
};

/** "Tue 11 Nov" */
export const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** "11 Nov 2026" */
export const dateLabel = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export type SessionPhase = "live" | "soon" | "upcoming" | "ended" | "unscheduled";

export const sessionInfo = (s: SessionDoc, now = Date.now()) => {
  const { startMs, endMs } = sessionWindow(s);
  const hasTime = Number.isFinite(startMs);
  const joinUrl = String((s as any).joinUrl || "").trim();
  const recordingUrl = String((s as any).recordingUrl || "").trim();
  const durationMins = Number.isFinite(endMs) && hasTime ? Math.round((endMs - startMs) / MIN) : Number((s as any).durationMins) || 60;
  let phase: SessionPhase = "unscheduled";
  if (hasTime) {
    if (now >= startMs && now <= endMs) phase = "live";
    else if (now < startMs && startMs - now <= JOIN_EARLY_MS) phase = "soon";
    else if (now < startMs) phase = "upcoming";
    else phase = "ended";
  }
  const isToday = hasTime && startOfDay(startMs) === startOfDay(now);
  return {
    startMs,
    endMs,
    hasTime,
    phase,
    joinUrl,
    recordingUrl,
    /** The join link works from 15 minutes before until the end. */
    canJoin: !!joinUrl && (phase === "live" || phase === "soon"),
    durationMins,
    week: Number((s as any).week) || 0,
    title: String((s as any).title || "Class").trim(),
    notes: String((s as any).notes || "").trim(),
    day: hasTime ? (isToday ? "Today" : dayLabel(startMs)) : "Time to be announced",
    timeRange: hasTime ? timeRange(startMs, endMs) : "",
    startTime: hasTime ? timeFmt(startMs) : "",
    /** Ended in the last two days without a recording yet. */
    recordingSoon: phase === "ended" && !recordingUrl && now - endMs <= 2 * DAY,
  };
};

export type SessionInfo = ReturnType<typeof sessionInfo>;

/** "Starts in 10 min", "Today", "Tomorrow", "In 3 days", "Fri". */
export const startsIn = (startMs: number, now = Date.now()) => {
  if (!Number.isFinite(startMs)) return "";
  const diff = startMs - now;
  if (diff <= 0) return "";
  if (diff < 60 * MIN) return `In ${Math.max(1, Math.round(diff / MIN))} min`;
  const days = Math.round((startOfDay(startMs) - startOfDay(now)) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

/** "2h ago", "Yesterday", "Fri", "3 Nov". */
export const ago = (value: unknown, now = Date.now()) => {
  const ms = toMs(value);
  if (!ms) return "";
  const diff = now - ms;
  if (diff < MIN) return "Just now";
  if (diff < 60 * MIN) return `${Math.round(diff / MIN)}m ago`;
  if (diff < DAY && startOfDay(ms) === startOfDay(now)) return `${Math.round(diff / (60 * MIN))}h ago`;
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(ms).toLocaleDateString("en-GB", { weekday: "short" });
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** Morning/afternoon/evening greeting for the local time. */
export const greeting = (now = new Date()) => {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
