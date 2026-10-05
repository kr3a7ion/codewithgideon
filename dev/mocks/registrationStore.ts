// Preview stand-in for services/registrationStore (UI preview only).
// Reads come from sample data; writes change the in-memory copy so admin
// flows (generate a schedule, start an intake, send an announcement) can be
// tried end to end without Firebase.
import { previewDb, previewProfile, previewResources, previewSessions, previewSpaces } from "./data";
import { Timestamp } from "./timestamp";

const wait = <T,>(value: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(value), ms));
const clone = <T,>(v: T): T => (Array.isArray(v) ? (v.map((x: any) => ({ ...x })) as any) : v);

const now = Date.now();
const day = 86_400_000;

const paths = [
  { id: "path_flutter", title: "Flutter & Mobile App Development", isActive: true, createdAt: 1, updatedAt: 1 },
  { id: "path_web", title: "Web Development & WordPress", isActive: true, createdAt: 2, updatedAt: 2 },
];
const courses = [
  {
    id: "course_flutter", pathId: "path_flutter", title: "Flutter & Mobile App Development", duration: "12 Weeks", sessions: "2× Weekly", level: "Beginner",
    description: "Build and ship Android apps with Flutter and Firebase.", weeks: 12, pricePerWeek: 10000, priceLabel: "₦10k/wk", isActive: true, showOnLanding: true, showInExplore: true, createdAt: 1, updatedAt: 1,
    syllabus: [
      { week: 1, title: "Dart basics", topics: ["Variables", "Functions"] },
      { week: 2, title: "Widgets and layouts", topics: ["Rows", "Columns", "Stacks"] },
      { week: 3, title: "State management with Riverpod", topics: ["Providers", "Notifiers"] },
      { week: 4, title: "Firebase Auth and Firestore", topics: [] },
    ],
  },
  { id: "course_web", pathId: "path_web", title: "Web Development & WordPress", duration: "8 Weeks", sessions: "2× Weekly", level: "Beginner", description: "HTML, CSS, JavaScript and WordPress sites.", weeks: 8, pricePerWeek: 10000, priceLabel: "₦10k/wk", isActive: true, showOnLanding: true, showInExplore: false, createdAt: 2, updatedAt: 2 },
];
const cohorts: any[] = [
  { id: "FLUTTER-2026-09", label: "September 2026 Cohort", isActive: true, pathId: "path_flutter", cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", createdAt: now - 30 * day, updatedAt: 3 },
  { id: "WEB-2026-09", label: "September 2026 Cohort", isActive: true, pathId: "path_web", cohortId: "WEB", cohortKey: "WEB-2026-09", createdAt: now - 28 * day, updatedAt: 3 },
  { id: "FLUTTER-2026-06", label: "June 2026 Cohort", isActive: true, pathId: "path_flutter", cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-06", createdAt: now - 110 * day, updatedAt: 3 },
];
const pastFlutter = [1, 2, 3, 4, 5, 6].map((week) => ({
  id: `W0${week}_june`, week, title: ["Dart basics", "Widgets and layouts", "State management with Riverpod", "Firebase Auth and Firestore", "Navigation", "Shipping to Android"][week - 1],
  path: "Flutter & Mobile App Development", pathId: "path_flutter", isPublished: true,
  startsAt: Timestamp.fromMillis(now - (100 - week * 7) * day), durationMins: 90, joinUrl: "https://meet.google.com/old-link", recordingUrl: week < 6 ? "https://youtube.com/watch?v=old" : "", notes: "",
}));
const sessionsByCohort: Record<string, any[]> = {
  "FLUTTER-2026-09": previewSessions.map((s: any) => ({ ...s })),
  "FLUTTER-2026-06": pastFlutter,
  "WEB-2026-09": [],
};
const messagesByCohort: Record<string, any[]> = {
  "FLUTTER-2026-09": [
    { id: "m1", cohortId: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", title: "Class starting soon", body: "Week 3: State management with Riverpod starts at 6:00 PM (WAT). Open Classes in the app or on the website to join.", sentBy: "automation", createdAt: now - 3 * 3600_000, status: "sent" },
    { id: "m2", cohortId: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", title: "Class moved to 7pm this Thursday", body: "Same link as usual.", sentBy: "admin", createdAt: now - 2 * day, status: "sent" },
  ],
};
const students: any[] = [
  { uid: "u1", fullName: "Ada Okafor", email: "ada@example.com", phone: "08031234567", path: "Flutter & Mobile App Development", pathId: "path_flutter", status: "Complete", weeksToCommit: 5, totalPrice: 50000, courseDurationWeeks: 12, role: "student", timestamp: now - 25 * day, cohortKey: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", ageRange: "18-24", gender: "Female" },
  { uid: "u2", fullName: "Tunde Bello", email: "tunde@example.com", phone: "08039876543", path: "Web Development & WordPress", pathId: "path_web", status: "Pending", weeksToCommit: 4, totalPrice: 40000, role: "student", timestamp: now - 2 * day, ageRange: "25-34", gender: "Male", pendingPayment: { kind: "initial", status: "Pending", weeks: 4, amount: 40000, reference: "CWG_TEST_1", createdAt: now - 5 * 3600_000 } },
  { uid: "u3", fullName: "Chioma Eze", email: "chioma@example.com", phone: "07012345678", path: "Flutter & Mobile App Development", pathId: "path_flutter", status: "Complete", weeksToCommit: 12, totalPrice: 120000, courseDurationWeeks: 12, role: "student", timestamp: now - 90 * day, cohortKey: "FLUTTER-2026-06", cohortLabel: "June 2026 Cohort" },
  { uid: "u4", fullName: "Emeka Obi", email: "emeka@example.com", phone: "", path: "Flutter & Mobile App Development", pathId: "path_flutter", status: "Pending", weeksToCommit: 2, totalPrice: 20000, role: "student", timestamp: now - 1 * day },
  { uid: "u5", fullName: "Funmi Adeyemi", email: "funmi@example.com", phone: "08120001111", path: "Flutter & Mobile App Development", pathId: "path_flutter", status: "Complete", weeksToCommit: 3, totalPrice: 30000, courseDurationWeeks: 12, role: "student", timestamp: now - 20 * day, cohortKey: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", pendingPayment: { kind: "topup", status: "Pending", weeks: 2, amount: 20000, reference: "CWG_TOPUP_9", createdAt: now - 26 * 3600_000 } },
];
const activeCohorts: Record<string, any> = {
  path_flutter: { pathId: "path_flutter", path: "Flutter & Mobile App Development", cohortId: "FLUTTER", seasonKey: "2026-09", cohortKey: "FLUTTER-2026-09", label: "September 2026 Cohort" },
  path_web: { pathId: "path_web", path: "Web Development & WordPress", cohortId: "WEB", seasonKey: "2026-09", cohortKey: "WEB-2026-09", label: "September 2026 Cohort" },
};
previewDb.activeCohorts = Object.entries(activeCohorts).map(([id, v]) => ({ id, ...v }));

const toTs = (v: any) => (typeof v === "number" ? Timestamp.fromMillis(v) : v);
const sessionId = (s: any) => {
  const d = new Date(s.startsAt.toMillis());
  const p = (n: number) => String(n).padStart(2, "0");
  return `W${p(s.week)}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}_${s.pathId}`;
};
const cohortIdFromPath = (title: string) => (title.toLowerCase().includes("flutter") ? "FLUTTER" : title.toLowerCase().includes("web") ? "WEB" : "CWG");

export const registrationStore: any = {
  getAll: async () => wait(clone(students)),
  getPaths: async () => wait(clone(paths)),
  getPath: async (id: string) => wait(paths.find((p) => p.id === id) || null),
  getCohorts: async () => wait(clone([...cohorts].sort((a, b) => b.createdAt - a.createdAt))),
  getCohortSessions: async (cohortId: string) =>
    wait(clone([...(sessionsByCohort[cohortId] || [])].sort((a, b) => a.week - b.week || a.startsAt.toMillis() - b.startsAt.toMillis()))),
  getCohortMessages: async (cohortId: string) => wait(clone([...(messagesByCohort[cohortId] || [])].sort((a, b) => b.createdAt - a.createdAt))),
  getResources: async () => wait(previewResources),
  getCommunitySpaces: async () => wait(previewSpaces),
  computeCohortKey: (id: string, season: string) => `${id}-${season}`,
  computeCohortIdFromPath: (title: string) => cohortIdFromPath(title),
  pathKey: (t: string) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  resolvePathId: async () => "path_flutter",
  getActiveCohortForPathId: async (pathId: string) => wait(activeCohorts[pathId] || { cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", label: "Current Cohort" }),
  getActiveCohortForPath: async () => wait(activeCohorts.path_flutter),
  getCourses: async () => wait(clone(courses)),
  getUnlockedSessionsForStudent: async (profile: any) =>
    wait(profile.status === "Complete" ? previewSessions.filter((s) => s.week <= profile.weeksToCommit) : [], 500),
  getPublishedResources: async () => wait(previewResources, 400),
  getPublishedCommunitySpaces: async () => wait(previewSpaces, 350),

  // ---- writes (in memory) ----
  addCohortSession: async (cohortId: string, input: any) => {
    const s = { ...input, startsAt: toTs(input.startsAt), createdAt: Date.now(), updatedAt: Date.now() };
    s.id = sessionId(s);
    const list = (sessionsByCohort[cohortId] ||= []);
    const i = list.findIndex((x) => x.id === s.id);
    if (i >= 0) list[i] = s;
    else list.push(s);
    return wait(s.id, 60);
  },
  updateCohortSession: async (cohortId: string, id: string, patch: any) => {
    const list = sessionsByCohort[cohortId] || [];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = { ...list[i], ...patch, ...(patch.startsAt ? { startsAt: toTs(patch.startsAt) } : {}), updatedAt: Date.now() };
    return wait(undefined, 120);
  },
  deleteCohortSession: async (cohortId: string, id: string) => {
    sessionsByCohort[cohortId] = (sessionsByCohort[cohortId] || []).filter((x) => x.id !== id);
    return wait(undefined, 120);
  },
  setActiveCohortForPathId: async (pathId: string, input: any) => {
    const p = paths.find((x) => x.id === pathId)!;
    const cohortId = String(input.cohortId || cohortIdFromPath(p.title)).toUpperCase();
    const cohortKey = `${cohortId}-${input.seasonKey}`;
    activeCohorts[pathId] = { pathId, path: p.title, cohortId, seasonKey: input.seasonKey, cohortKey, label: input.seasonLabel };
    previewDb.activeCohorts = Object.entries(activeCohorts).map(([id, v]) => ({ id, ...v }));
    const existing = cohorts.find((c) => c.id === cohortKey);
    if (existing) existing.label = input.seasonLabel;
    else cohorts.push({ id: cohortKey, label: input.seasonLabel, isActive: true, pathId, path: p.title, cohortId, cohortKey, createdAt: Date.now(), updatedAt: Date.now() });
    sessionsByCohort[cohortKey] ||= [];
    return wait({ ...activeCohorts[pathId] }, 200);
  },
  deleteCohort: async (id: string) => {
    const i = cohorts.findIndex((c) => c.id === id);
    if (i >= 0) cohorts.splice(i, 1);
    return wait(undefined);
  },
  sendCohortMessage: async (input: any) => {
    const m = { id: `m${Date.now()}`, ...input, createdAt: Date.now(), status: "sent" };
    (messagesByCohort[input.cohortId] ||= []).push(m);
    return wait(m.id);
  },
  updateCohortMessage: async (cohortId: string, id: string, patch: any) => {
    const list = messagesByCohort[cohortId] || [];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = { ...list[i], ...patch };
    return wait(undefined);
  },
  deleteCohortMessage: async (cohortId: string, id: string) => {
    messagesByCohort[cohortId] = (messagesByCohort[cohortId] || []).filter((x) => x.id !== id);
    return wait(undefined);
  },
  updateStatus: async (uid: string, status: string) => {
    const s = students.find((x) => x.uid === uid);
    if (s) s.status = status;
    return wait(undefined);
  },
  delete: async (uid: string) => {
    const i = students.findIndex((x) => x.uid === uid);
    if (i >= 0) students.splice(i, 1);
    return wait(undefined);
  },
  clearAll: async () => {
    students.splice(0, students.length);
    return wait(undefined);
  },
  // ---- join flow ----
  createAuthOnly: async (email: string) => wait({ uid: "student_1", email }, 600),
  resetPassword: async () => wait(undefined, 400),
  completeStudentProfileAfterLogin: async () => wait(undefined, 600),
  getUserProfile: async () => wait({ ...previewProfile }, 200),
  setPendingPayment: async () => wait(undefined, 200),
  clearPendingPayment: async (uid: string) => {
    const s = students.find((x) => x.uid === uid);
    if (s) delete s.pendingPayment;
    return wait(undefined);
  },
  approveInitialPayment: async (uid: string) => {
    const s = students.find((x) => x.uid === uid);
    if (s) {
      s.status = "Complete";
      delete s.pendingPayment;
    }
    return wait(undefined);
  },
  approveTopUpFromPending: async (uid: string, p: any) => {
    const s = students.find((x) => x.uid === uid);
    if (s) {
      s.weeksToCommit += Number(p.weeks || 0);
      delete s.pendingPayment;
    }
    return wait(undefined);
  },
  addPath: async (input: any) => {
    const id = `path_${Date.now()}`;
    paths.push({ id, ...input, createdAt: Date.now(), updatedAt: Date.now() });
    return wait(id);
  },
  updatePath: async (id: string, patch: any) => {
    const p: any = paths.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    return wait(undefined);
  },
  deletePath: async (id: string) => {
    const i = paths.findIndex((x) => x.id === id);
    if (i >= 0) paths.splice(i, 1);
    return wait(undefined);
  },
  updateCourse: async (id: string, patch: any) => {
    const c: any = courses.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    return wait(undefined);
  },
  addCourse: async (input: any) => {
    const id = `course_${Date.now()}`;
    courses.push({ id, ...input, createdAt: Date.now(), updatedAt: Date.now() });
    return wait(id);
  },
  deleteCourse: async (id: string) => {
    const i = courses.findIndex((x) => x.id === id);
    if (i >= 0) courses.splice(i, 1);
    return wait(undefined);
  },
};
