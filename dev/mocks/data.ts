import { Timestamp } from "./timestamp";

const now = Date.now();
const day = 86_400_000;
const params = new URLSearchParams(window.location.search);
export const previewState = params.get("state") || "active"; // active | locked | empty

const sessions = [1, 2, 3, 4, 5].map((week) => ({
  id: `W0${week}`,
  week,
  title: [
    "Dart fundamentals & your first Flutter app",
    "Layouts, widgets and responsive UI",
    "State management with Riverpod",
    "Firebase Auth and Firestore",
    "Shipping to Android",
  ][week - 1],
  path: "Flutter & Mobile App Development",
  pathId: "path_flutter",
  isPublished: true,
  startsAt: Timestamp.fromMillis(now + (week - 3) * 7 * day + (week === 3 ? -20 * 60_000 : 0)),
  durationMins: 90,
  joinUrl: week >= 3 ? "https://meet.google.com/abc-defg-hij" : "",
  recordingUrl: week < 3 ? "https://youtube.com/watch?v=preview" : "",
  notes: week === 3 ? "Bring questions from last week's exercise. We'll build a todo app live." : "",
}));

export const previewProfile: any = {
  uid: "student_1",
  fullName: "Ada Okafor",
  email: "ada@example.com",
  phone: "08031234567",
  path: "Flutter & Mobile App Development",
  pathId: "path_flutter",
  courseId: "course_flutter",
  status: previewState === "locked" ? "Pending" : "Complete",
  weeksToCommit: previewState === "locked" ? 4 : 5,
  totalPrice: 50000,
  cohortId: "FLUTTER",
  cohortKey: "FLUTTER-2026-09",
  cohortLabel: "September 2026 Cohort",
  courseDurationWeeks: 12,
  weeklyRate: 10000,
  timestamp: now - 30 * day,
  role: "student",
  ageRange: "18-24",
  gender: "Female",
  ...(previewState === "locked"
    ? { pendingPayment: { kind: "initial", status: "Pending", weeks: 4, amount: 40000, reference: "CWG_MFX2K_1A2B", createdAt: now } }
    : {}),
};

const empty = previewState === "empty";

export const previewSessions = empty ? [] : sessions;
export const previewResources = empty
  ? []
  : [
      { id: "r1", name: "Week 1 slides", type: "PDF", size: "2.4 MB", folder: "Week 1", url: "https://example.com", description: "Dart basics, variables, functions and classes.", sessionWeek: 1, isPublished: true, updatedAt: now },
      { id: "r2", name: "Riverpod cheat sheet", type: "Link", size: "", folder: "References", url: "https://example.com", description: "Providers, notifiers and when to use each.", isPublished: true, updatedAt: now },
      { id: "r3", name: "Starter project", type: "GitHub", size: "", folder: "Week 3", url: "https://example.com", sessionWeek: 3, isPublished: true, updatedAt: now },
    ];
export const previewSpaces = empty
  ? []
  : [
      { id: "s1", title: "Cohort WhatsApp group", description: "Daily questions, quick help and class reminders for the September cohort.", category: "Cohort", roomUrl: "https://chat.whatsapp.com/x", ctaLabel: "Join group", isPublished: true, sortOrder: 0 },
      { id: "s2", title: "Code review room", description: "Share your repo link and get feedback from classmates and your mentor.", category: "Support", roomUrl: "https://discord.gg/x", isPublished: true, sortOrder: 1 },
    ];

export const previewDb: Record<string, any> = {
  "config/app": null,
  mentorThreads: [
    { id: "mentor_u1", studentUid: "u1", studentName: "Ada Okafor", studentEmail: "ada@example.com", status: "new", channel: "web_chat", threadType: "student_mentor_chat", lastMessage: "My ListView throws an unbounded height error.", lastMessageAt: Timestamp.fromMillis(now - 3600_000), lastMessageSenderType: "user", updatedAt: Timestamp.fromMillis(now - 3600_000), createdAt: Timestamp.fromMillis(now - 7200_000) },
  ],
  contactMessages: [
    { id: "c1", name: "Chioma", email: "chioma@example.com", message: "Do you have a weekend class?", status: "new", source: "web-contact-form", createdAt: Timestamp.fromMillis(now - 5 * 3600_000) },
  ],
  "**/payments": [
    { id: "CWG_PAID_1", reference: "CWG_PAID_1", uid: "u1", status: "success", kind: "initial", weeks: 5, amountKobo: 5000000, baseAmount: 50000, weeklyRate: 10000, email: "ada@example.com", verifiedAt: Timestamp.fromMillis(now - 20 * day), source: "verify" },
  ],
  "users/student_1/notificationReads": [{ id: "FLUTTER-2026-09_m2", readAt: new Date() }],
  "cohorts/FLUTTER-2026-09/messages": empty
    ? []
    : [
        { id: "m1", title: "Class moved to 7pm this Thursday", body: "Hi all, this week's class starts an hour later. Same link.", createdAt: now - 2 * 3600_000, cohortId: "FLUTTER-2026-09" },
        { id: "m2", title: "Week 2 recording is up", body: "Catch up before Thursday if you missed it.", createdAt: now - 3 * day, ctaLabel: "Watch", ctaUrl: "https://youtube.com", cohortId: "FLUTTER-2026-09" },
      ],
  "mentorThreads/mentor_student_1": empty
    ? null
    : { studentUid: "student_1", lastMessage: "Try wrapping the ListView in Expanded.", lastMessageSenderType: "admin", lastMessageAt: Timestamp.fromMillis(now - 600_000) },
  "mentorThreads/mentor_student_1/messages": empty
    ? []
    : [
        { id: "a", body: "My ListView throws 'Vertical viewport was given unbounded height'. What am I doing wrong?", senderType: "user", createdAt: Timestamp.fromMillis(now - 3600_000) },
        { id: "b", body: "It's inside a Column, right? Try wrapping the ListView in Expanded so it gets a bounded height.", senderType: "admin", senderName: "Gideon", createdAt: Timestamp.fromMillis(now - 600_000) },
      ],
};
