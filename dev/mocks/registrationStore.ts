// Preview stand-in for services/registrationStore (UI preview only).
import { previewResources, previewSessions, previewSpaces } from "./data";

const wait = <T,>(value: T, ms = 300) => new Promise<T>((r) => setTimeout(() => r(value), ms));

export const registrationStore: any = {
  resolvePathId: async () => "path_flutter",
  getActiveCohortForPathId: async () => wait({ cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", label: "September 2026 Cohort" }),
  getActiveCohortForPath: async () => wait({ cohortId: "FLUTTER", cohortKey: "FLUTTER-2026-09", label: "September 2026 Cohort" }),
  getCourses: async () =>
    wait([{ id: "course_flutter", pathId: "path_flutter", title: "Flutter & Mobile App Development", weeks: 12, pricePerWeek: 10000, isActive: true }]),
  getUnlockedSessionsForStudent: async (profile: any) =>
    wait(profile.status === "Complete" ? previewSessions.filter((s) => s.week <= profile.weeksToCommit) : [], 500),
  getPublishedResources: async () => wait(previewResources, 400),
  getPublishedCommunitySpaces: async () => wait(previewSpaces, 350),
};
