/** Legacy view names still used by components' onNavigate(view) calls. */
export type View =
  | "home"
  | "contact"
  | "privacy"
  | "terms"
  | "refund"
  | "curriculums"
  | "course-detail"
  | "path-flutter"
  | "path-web"
  | "path-ai"
  | "registration"
  | "payment"
  | "student-login"
  | "student-dashboard"
  | "admin-login"
  | "admin-dashboard"
  | "create-account"
  | "continue-registration"
  | "verify-email";

/** Student area sections, each with its own URL. */
export const STUDENT_SECTIONS = [
  "dashboard",
  "classes",
  "resources",
  "community",
  "chat",
  "notifications",
  "badges",
  "account",
  "more",
] as const;
