/**
 * Remembers which course the visitor picked on a course page, so the join
 * flow still knows after a reload, or when the email confirmation link opens
 * in another tab. Values look like "cid:<courseId>", "pid:<pathId>" or a
 * course/path title (older links).
 */
const KEY = "cwg_join_course";

export const rememberJoinCourse = (value: string) => {
  const v = String(value || "").trim();
  if (!v) return;
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // Private mode: the in-memory selection still works for this tab.
  }
};

export const readJoinCourse = (): string => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

export const forgetJoinCourse = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

export type CourseRef = { kind: "courseId" | "pathId" | "title"; value: string };

export const parseCourseRef = (raw: string): CourseRef => {
  const v = String(raw || "").trim();
  const lower = v.toLowerCase();
  if (lower.startsWith("cid:")) return { kind: "courseId", value: v.slice(4).trim() };
  if (lower.startsWith("pid:")) return { kind: "pathId", value: v.slice(4).trim() };
  return { kind: "title", value: v };
};
