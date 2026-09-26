// Preview stand-in for services/registrationStore (UI preview only).
import { previewResources, previewSessions, previewSpaces } from "./data";

const wait = <T,>(value: T, ms = 300) => new Promise<T>((r) => setTimeout(() => r(value), ms));

const paths = [
  { id: "path_flutter", title: "Flutter & Mobile App Development", isActive: true, createdAt: 1, updatedAt: 1 },
  { id: "path_web", title: "Web Development & WordPress", isActive: true, createdAt: 2, updatedAt: 2 },
];
const courses = [
  { id: "course_flutter", pathId: "path_flutter", title: "Flutter & Mobile App Development", duration: "12 Weeks", sessions: "24 live classes", level: "Beginner", description: "Build and ship Android apps with Flutter and Firebase.", weeks: 12, pricePerWeek: 10000, priceLabel: "₦10k/wk", isActive: true, showOnLanding: true, showInExplore: true, createdAt: 1, updatedAt: 1, syllabus: [{ week: 1, title: "Dart basics", topics: ["Variables", "Functions"] }] },
  { id: "course_web", pathId: "path_web", title: "Web Development & WordPress", duration: "8 Weeks", sessions: "16 live classes", level: "Beginner", description: "HTML, CSS, JavaScript and WordPress sites.", weeks: 8, pricePerWeek: 10000, priceLabel: "₦10k/wk", isActive: true, showOnLanding: true, showInExplore: true, createdAt: 2, updatedAt: 2 },
];
const cohorts = [
  { id: "FLUTTER-2026-09", label: "September 2026 Cohort", isActive: true, pathId: "path_flutter", cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", createdAt: 3, updatedAt: 3 },
];
const students = [
  { uid: "u1", fullName: "Ada Okafor", email: "ada@example.com", phone: "08031234567", path: "Flutter & Mobile App Development", pathId: "path_flutter", status: "Complete", weeksToCommit: 5, totalPrice: 50000, role: "student", timestamp: 1758800000000, cohortKey: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", ageRange: "18-24", gender: "Female" },
  { uid: "u2", fullName: "Tunde Bello", email: "tunde@example.com", phone: "08039876543", path: "Web Development & WordPress", pathId: "path_web", status: "Pending", weeksToCommit: 4, totalPrice: 40000, role: "student", timestamp: 1758900000000, ageRange: "25-34", gender: "Male", pendingPayment: { kind: "initial", status: "Pending", weeks: 4, amount: 40000, reference: "CWG_TEST_1", createdAt: 1758900000000 } },
];

export const registrationStore: any = {
  getAll: async () => wait(students),
  getPaths: async () => wait(paths),
  getCohorts: async () => wait(cohorts),
  getCohortSessions: async () => wait(previewSessions),
  getCohortMessages: async () => wait([{ id: "m1", cohortId: "FLUTTER-2026-09", cohortLabel: "September 2026 Cohort", title: "Class moved to 7pm", body: "Same link as usual.", sentAt: null, createdAt: 1758900000000, status: "sent" }]),
  getResources: async () => wait(previewResources),
  getCommunitySpaces: async () => wait(previewSpaces),
  computeCohortKey: (id: string, season: string) => `${id}-${season}`,
  pathKey: (t: string) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-"),

  resolvePathId: async () => "path_flutter",
  getActiveCohortForPathId: async () => wait({ cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", label: "September 2026 Cohort" }),
  getActiveCohortForPath: async () => wait({ cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", label: "September 2026 Cohort" }),
  getCourses: async () => wait(courses),
  getUnlockedSessionsForStudent: async (profile: any) =>
    wait(profile.status === "Complete" ? previewSessions.filter((s) => s.week <= profile.weeksToCommit) : [], 500),
  getPublishedResources: async () => wait(previewResources, 400),
  getPublishedCommunitySpaces: async () => wait(previewSpaces, 350),
};
