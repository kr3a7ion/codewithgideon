import type { SessionDoc } from "../../../services/registrationStore";
import { sessionWindow } from "./lib";

const SITE = "https://codewithgideon.com";

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const escapeIcs = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const eventTitle = (s: SessionDoc, course: string) => {
  const week = Number((s as any).week) || 0;
  const title = String((s as any).title || "Live class").trim();
  return `${week ? `Week ${week}: ` : ""}${title} · ${course || "CodeWithGideon"}`;
};

const description = () =>
  `Live class with Gideon. Join from Classes in your CodeWithGideon dashboard (${SITE}/student/classes) or the app. The join link opens 15 minutes before class.`;

/** One VEVENT per timed session. */
const vevents = (sessions: SessionDoc[], course: string) =>
  sessions
    .map((s) => {
      const { startMs, endMs } = sessionWindow(s);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "";
      return [
        "BEGIN:VEVENT",
        `UID:${(s as any).id || startMs}@codewithgideon.com`,
        `DTSTAMP:${stamp(Date.now())}`,
        `DTSTART:${stamp(startMs)}`,
        `DTEND:${stamp(endMs)}`,
        `SUMMARY:${escapeIcs(eventTitle(s, course))}`,
        `DESCRIPTION:${escapeIcs(description())}`,
        `URL:${SITE}/student/classes`,
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Class starts in 15 minutes",
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    })
    .filter(Boolean);

export const googleCalendarUrl = (s: SessionDoc, course: string) => {
  const { startMs, endMs } = sessionWindow(s);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(s, course),
    dates: `${stamp(startMs)}/${stamp(endMs)}`,
    details: description(),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Adds classes to the student's calendar: Google Calendar on Android (one
 * class at a time), an .ics file everywhere else (iPhone, Mac, Outlook).
 */
export const addToCalendar = (sessions: SessionDoc[], course: string) => {
  const timed = sessions.filter((s) => Number.isFinite(sessionWindow(s).startMs));
  if (!timed.length) return;
  if (timed.length === 1 && /android/i.test(navigator.userAgent)) {
    window.open(googleCalendarUrl(timed[0], course), "_blank", "noopener,noreferrer");
    return;
  }
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CodeWithGideon//Classes//EN", "CALSCALE:GREGORIAN", ...vevents(timed, course), "END:VCALENDAR"].join(
    "\r\n",
  );
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = timed.length === 1 ? "codewithgideon-class.ics" : "codewithgideon-classes.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
};
