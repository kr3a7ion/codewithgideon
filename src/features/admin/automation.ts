/**
 * Pure helpers behind the admin automations that run in the browser:
 * generating a class schedule from a course syllabus, copying a schedule to
 * a new intake with shifted dates, and naming the next intake.
 */
import type { SessionDoc, SyllabusWeek } from "../../../services/registrationStore";
import { sessionTimeToMs, toLocalDateInput, toLocalTimeInput } from "./lib";

const DAY_MS = 86_400_000;

export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
];

export type SessionDraft = {
  week: number;
  title: string;
  startsAtMs: number;
  durationMins: number;
  joinUrl: string;
  notes: string;
  isPublished: boolean;
};

export type ScheduleOptions = {
  /** First day of week 1, YYYY-MM-DD (local time). */
  startDate: string;
  /** Days of the week classes run on (0 = Sunday). */
  weekdays: number[];
  /** HH:MM, local time. */
  time: string;
  durationMins: number;
  weeks: number;
  joinUrl: string;
  publish: boolean;
};

const parseLocalDate = (date: string): Date | null => {
  const [y, m, d] = String(date || "").split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const withTime = (day: Date, time: string): number => {
  const [hh, mm] = String(time || "18:00").split(":").map((x) => parseInt(x, 10));
  const d = new Date(day);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.getTime();
};

/** Class titles must be at least 3 characters (Firestore rules). */
export const safeTitle = (title: string, week: number) => {
  const t = String(title || "").trim();
  if (!t) return `Week ${week} class`;
  return t.length < 3 ? `Week ${week}: ${t}` : t.slice(0, 140);
};

/**
 * The id registrationStore.addCohortSession gives a class, so a batch can
 * skip classes that already exist even if they were edited since.
 */
export const sessionDocId = (week: number, startsAtMs: number, pathId: string) => {
  const d = new Date(startsAtMs);
  const p = (n: number) => String(n).padStart(2, "0");
  const safePathId = String(pathId || "nopid").trim().replace(/[^\w-]/g, "_");
  return `W${p(week || 1)}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}_${safePathId}`;
};

const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * One class per selected weekday for each week, starting from the week that
 * begins on `startDate`. Titles come from the syllabus when it has that week.
 */
export const buildSchedule = (
  options: ScheduleOptions,
  syllabus: SyllabusWeek[] = [],
): SessionDraft[] => {
  const start = parseLocalDate(options.startDate);
  const weekdays = [...new Set(options.weekdays)].filter((d) => d >= 0 && d <= 6);
  const weeks = Math.max(1, Math.min(52, Math.floor(options.weeks || 1)));
  if (!start || weekdays.length === 0) return [];

  const drafts: SessionDraft[] = [];
  for (let w = 0; w < weeks; w += 1) {
    const weekStart = addDays(start, w * 7);
    const days = weekdays
      .map((d) => addDays(weekStart, (d - weekStart.getDay() + 7) % 7))
      .sort((a, b) => a.getTime() - b.getTime());

    const plan = syllabus.find((s) => Number(s.week) === w + 1) || syllabus[w];
    const baseTitle = String(plan?.title || "").trim() || `Week ${w + 1} class`;
    const topics = (plan?.topics || []).map((t) => String(t).trim()).filter(Boolean);

    days.forEach((day, i) => {
      drafts.push({
        week: w + 1,
        title: safeTitle(days.length > 1 ? `${baseTitle} (part ${i + 1})` : baseTitle, w + 1),
        startsAtMs: withTime(day, options.time),
        durationMins: Math.max(15, Math.min(600, Math.floor(options.durationMins || 60))),
        joinUrl: options.joinUrl.trim(),
        notes: topics.length ? `Topics: ${topics.join(", ")}` : "",
        isPublished: options.publish,
      });
    });
  }
  return drafts;
};

/**
 * Copy classes to a new intake: same weeks, titles, times and links, moved
 * so the first class lands on `newFirstDate`. Recordings are not copied.
 */
export const shiftSchedule = (
  sessions: SessionDoc[],
  newFirstDate: string,
  publish: boolean,
): SessionDraft[] => {
  const target = parseLocalDate(newFirstDate);
  const sorted = [...sessions].sort(
    (a, b) => sessionTimeToMs((a as any).startsAt) - sessionTimeToMs((b as any).startsAt),
  );
  if (!target || !sorted.length) return [];

  const firstMs = sessionTimeToMs((sorted[0] as any).startsAt);
  const firstDay = parseLocalDate(toLocalDateInput(firstMs))!;
  const shiftDays = Math.round((target.getTime() - firstDay.getTime()) / DAY_MS);

  return sorted.map((s) => {
    const ms = sessionTimeToMs((s as any).startsAt);
    const day = addDays(parseLocalDate(toLocalDateInput(ms))!, shiftDays);
    return {
      week: Number(s.week || 1),
      title: safeTitle(String(s.title || ""), Number(s.week || 1)),
      startsAtMs: withTime(day, toLocalTimeInput(ms)),
      durationMins: Number((s as any).durationMins || 60),
      joinUrl: String((s as any).joinUrl || ""),
      notes: String((s as any).notes || ""),
      isPublished: publish,
    };
  });
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const currentSeasonKey = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

/** "2026-09" -> "2026-10"; "2026-12" -> "2027-01". */
export const nextSeasonKey = (seasonKey: string) => {
  const [y, m] = String(seasonKey || "").split("-").map((x) => parseInt(x, 10));
  if (!y || !m) return currentSeasonKey();
  return m >= 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** "2026-10" -> "October 2026 Cohort". */
export const seasonLabel = (seasonKey: string) => {
  const [y, m] = String(seasonKey || "").split("-").map((x) => parseInt(x, 10));
  if (!y || !m || m < 1 || m > 12) return "New Cohort";
  return `${MONTHS[m - 1]} ${y} Cohort`;
};

/** The first Monday after today (next week's Monday on a Monday), as YYYY-MM-DD. */
export const nextMonday = (from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const offset = (8 - d.getDay()) % 7 || 7;
  return toLocalDateInput(addDays(d, offset).getTime());
};

export const formatDraftWhen = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
