// Firestore security rules tests.
// Run locally (needs Java + Firebase CLI):  npm run test:rules
//
// Each test mirrors a real query or write made by the web app, the admin
// dashboard, the Cloud Functions, or the mobile app (including the v1.0.0 APK
// that is already installed on students' phones).
import {after, before, beforeEach, test} from "node:test";
import {readFileSync} from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  collectionGroup,
} from "firebase/firestore";

const COHORT = "FLUTTER-2026-09";
const OTHER_COHORT = "WEB-2026-09";
const PATH_ID = "path_flutter";

let env;

const student = (uid, overrides = {}) => ({
  uid,
  role: "student",
  status: "Complete",
  timestamp: Date.now(),
  fullName: "Ada Student",
  email: `${uid}@example.com`,
  phone: "08030000000",
  ageRange: "18-24",
  gender: "Female",
  weeksToCommit: 4,
  totalPrice: 40000,
  path: "Flutter & Mobile App Development",
  pathId: PATH_ID,
  courseId: "course_flutter",
  cohortId: "FLUTTER",
  cohortKey: COHORT,
  cohortLabel: "September 2026",
  updatedAt: Date.now(),
  ...overrides,
});

const session = (week, overrides = {}) => ({
  week,
  path: "Flutter & Mobile App Development",
  pathId: PATH_ID,
  isPublished: true,
  title: `Week ${week} class`,
  startsAt: Timestamp.fromMillis(Date.now() + week * 86400000),
  joinUrl: "https://meet.example.com/x",
  durationMins: 60,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const db = (uid) =>
  uid ?
    env.authenticatedContext(uid, {email_verified: true}).firestore() :
    env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-cwg-rules",
    firestore: {rules: readFileSync("firestore.rules", "utf8")},
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    await setDoc(doc(a, "admins/admin1"), {email: "admin@example.com"});
    await setDoc(doc(a, "users/paid"), student("paid"));
    await setDoc(doc(a, "users/pending"), student("pending", {status: "Pending"}));
    // Written by Cloud Functions with server timestamps.
    await setDoc(doc(a, "users/serverTouched"), student("serverTouched", {
      updatedAt: serverTimestamp(),
      pendingPayment: {
        kind: "topup", status: "Pending", weeks: 1, amount: 10000,
        baseAmount: 10000, weeklyRate: 10000, reference: "CWG_ABC_123",
        createdAt: serverTimestamp(),
      },
    }));
    // Paid student with an abandoned top-up.
    await setDoc(doc(a, "users/topupPending"), student("topupPending", {
      pendingPayment: {
        kind: "topup", status: "Pending", weeks: 2, amount: 20000,
        reference: "CWG_TOPUP_1", createdAt: Date.now(),
      },
    }));
    await setDoc(doc(a, `cohorts/${COHORT}`), {label: "September 2026"});
    for (const w of [1, 2, 3, 4, 5, 6]) {
      await setDoc(doc(a, `cohorts/${COHORT}/sessions/W0${w}`), session(w));
    }
    await setDoc(doc(a, `cohorts/${COHORT}/messages/m1`), {
      cohortId: COHORT, cohortLabel: "Sept", title: "Hello", body: "Welcome all",
      sentAt: serverTimestamp(), createdAt: Date.now(), status: "sent",
    });
    await setDoc(doc(a, `cohorts/${OTHER_COHORT}/sessions/W01`), session(1));
    await setDoc(doc(a, "resources/r1"), {
      name: "Slides", type: "PDF", size: "1MB", folder: "Week 1",
      url: "https://example.com/r1", isPublished: true,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    await setDoc(doc(a, "resources/r2"), {
      name: "Draft", type: "PDF", size: "1MB", folder: "Week 2",
      url: "https://example.com/r2", isPublished: false,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    await setDoc(doc(a, "mentorThreads/mentor_paid"), {
      studentUid: "paid", threadType: "student_mentor_chat",
      updatedAt: serverTimestamp(), status: "new",
    });
    await setDoc(doc(a, "mentorThreads/mentor_paid/messages/x1"), {
      body: "Hi", createdAt: serverTimestamp(),
    });
    await setDoc(doc(a, "users/paid/payments/CWG_ABC_123"), {
      reference: "CWG_ABC_123", verifiedAt: serverTimestamp(),
    });
  });
});

// ---------------- users ----------------

test("student can create their own Pending profile", async () => {
  const s = student("newbie", {status: "Pending"});
  await assertSucceeds(setDoc(doc(db("newbie"), "users/newbie"), s));
});

test("student cannot create a Complete profile", async () => {
  await assertFails(setDoc(doc(db("cheater"), "users/cheater"), student("cheater")));
});

test("student can edit name and phone (mobile profile edit)", async () => {
  await assertSucceeds(updateDoc(doc(db("paid"), "users/paid"), {
    fullName: "Ada Lovelace", phone: "08031111111", updatedAt: Date.now(),
  }));
});

test("student cannot change status, weeks, price, course or cohort", async () => {
  const d = doc(db("pending"), "users/pending");
  await assertFails(updateDoc(d, {status: "Complete"}));
  await assertFails(updateDoc(d, {weeksToCommit: 12}));
  await assertFails(updateDoc(d, {totalPrice: 0}));
  await assertFails(updateDoc(d, {courseId: "other"}));
  await assertFails(updateDoc(doc(db("paid"), "users/paid"), {cohortKey: OTHER_COHORT}));
});

test("web pending-payment write (with baseAmount/weeklyRate) is allowed", async () => {
  await assertSucceeds(updateDoc(doc(db("pending"), "users/pending"), {
    pendingPayment: {
      kind: "initial", status: "Pending", weeks: 4, amount: 40000,
      baseAmount: 40000, weeklyRate: 10000, reference: "CWG_WEB_1",
      createdAt: Date.now(),
    },
    updatedAt: Date.now(),
  }));
});

test("student can clear their pending payment", async () => {
  await assertSucceeds(updateDoc(doc(db("topupPending"), "users/topupPending"), {
    pendingPayment: deleteField(), updatedAt: Date.now(),
  }));
});

test("server-written timestamps don't lock the student out", async () => {
  await assertSucceeds(updateDoc(doc(db("serverTouched"), "users/serverTouched"), {
    phone: "08032222222", updatedAt: Date.now(),
  }));
});

test("pending student can change course before paying (registration form)", async () => {
  const next = student("pending", {
    status: "Pending", path: "Web Development & WordPress", pathId: "path_web",
    courseId: "course_web", weeksToCommit: 2, totalPrice: 20000,
    cohortId: "WEB", cohortKey: OTHER_COHORT, timestamp: Date.now(),
  });
  await assertSucceeds(setDoc(doc(db("pending"), "users/pending"), next));
});

test("paid student cannot rewrite enrolment via the registration form", async () => {
  const next = student("paid", {weeksToCommit: 12, cohortKey: OTHER_COHORT});
  await assertFails(setDoc(doc(db("paid"), "users/paid"), next));
});

test("pending student cannot mark themselves Complete via the form", async () => {
  await assertFails(setDoc(doc(db("pending"), "users/pending"), student("pending")));
});

test("students can't read other students", async () => {
  await assertFails(getDoc(doc(db("paid"), "users/pending")));
});

test("student can read own payments, not write them", async () => {
  await assertSucceeds(getDoc(doc(db("paid"), "users/paid/payments/CWG_ABC_123")));
  await assertFails(setDoc(doc(db("paid"), "users/paid/payments/fake"), {weeks: 12}));
});

test("admin payments collection-group query works", async () => {
  await assertSucceeds(getDocs(query(collectionGroup(db("admin1"), "payments"), orderBy("verifiedAt", "desc"))));
  await assertFails(getDocs(query(collectionGroup(db("paid"), "payments"))));
});

test("payment locks and webhook logs are server-only", async () => {
  await assertFails(getDoc(doc(db("paid"), "paymentReferences/CWG_ABC_123")));
  await assertFails(getDoc(doc(db("paid"), "webhookEvents/1")));
});

// ---------------- sessions ----------------

test("mobile v1.0.0: paid student lists all sessions in own cohort", async () => {
  await assertSucceeds(getDocs(collection(db("paid"), `cohorts/${COHORT}/sessions`)));
});

test("web: paid student runs the filtered unlocked-sessions query", async () => {
  await assertSucceeds(getDocs(query(
    collection(db("paid"), `cohorts/${COHORT}/sessions`),
    where("pathId", "==", PATH_ID),
    where("isPublished", "==", true),
    where("week", "<=", 4),
    orderBy("week", "asc"),
  )));
});

test("pending top-up does not lock a paid student out of sessions", async () => {
  await assertSucceeds(getDocs(collection(db("topupPending"), `cohorts/${COHORT}/sessions`)));
});

// TEMPORARY while mobile v1.0.0 is installed: an unpaid student registered in
// the cohort can list its sessions (the app hides locked weeks). When the
// strict rule is switched on, change this to assertFails.
test("TEMPORARY: unpaid student in the cohort can list sessions (APK v1.0.0)", async () => {
  await assertSucceeds(getDocs(collection(db("pending"), `cohorts/${COHORT}/sessions`)));
});

test("student with no profile cannot read sessions", async () => {
  await assertFails(getDocs(collection(db("stranger"), `cohorts/${COHORT}/sessions`)));
});

test("student cannot read another cohort's sessions", async () => {
  await assertFails(getDocs(collection(db("paid"), `cohorts/${OTHER_COHORT}/sessions`)));
});

test("signed-out visitors cannot read sessions", async () => {
  await assertFails(getDoc(doc(db(null), `cohorts/${COHORT}/sessions/W01`)));
});

// ---------------- cohort messages ----------------

test("student reads own cohort announcements only", async () => {
  await assertSucceeds(getDocs(query(collection(db("paid"), `cohorts/${COHORT}/messages`), orderBy("createdAt", "desc"))));
  await assertFails(getDocs(collection(db("paid"), `cohorts/${OTHER_COHORT}/messages`)));
});

// ---------------- resources / community ----------------

test("mobile v1.0.0: registered student lists all resources", async () => {
  await assertSucceeds(getDocs(query(collection(db("paid"), "resources"), orderBy("updatedAt", "desc"))));
});

test("web: published resources query", async () => {
  await assertSucceeds(getDocs(query(collection(db("paid"), "resources"), where("isPublished", "==", true))));
});

test("signed-out visitors cannot read resources", async () => {
  await assertFails(getDocs(collection(db(null), "resources")));
});

test("mobile v1.0.0: community spaces ordered by sortOrder", async () => {
  await assertSucceeds(getDocs(query(collection(db("paid"), "communitySpaces"), orderBy("sortOrder"))));
});

// ---------------- mentor chat ----------------

test("student opens own thread before it exists (web id)", async () => {
  await assertSucceeds(getDoc(doc(db("pending"), "mentorThreads/mentor_pending")));
  await assertSucceeds(getDocs(query(collection(db("pending"), "mentorThreads/mentor_pending/messages"), orderBy("createdAt", "asc"))));
});

test("mobile v1.0.0 per-session thread id is readable", async () => {
  await assertSucceeds(getDoc(doc(db("paid"), "mentorThreads/mentor_paid_W01")));
  await assertSucceeds(getDocs(collection(db("paid"), "mentorThreads/mentor_paid_W01/messages")));
});

test("mobile summary: list own threads by studentUid", async () => {
  await assertSucceeds(getDocs(query(
    collection(db("paid"), "mentorThreads"),
    where("studentUid", "==", "paid"),
    orderBy("updatedAt", "desc"),
  )));
});

test("student cannot read someone else's thread", async () => {
  await assertFails(getDoc(doc(db("pending"), "mentorThreads/mentor_paid")));
  await assertFails(getDocs(collection(db("pending"), "mentorThreads/mentor_paid/messages")));
});

test("students cannot post into threads directly (Cloud Function only)", async () => {
  await assertFails(setDoc(doc(db("paid"), "mentorThreads/mentor_paid/messages/y"), {body: "x"}));
});

test("student can mark own thread as read", async () => {
  await assertSucceeds(updateDoc(doc(db("paid"), "mentorThreads/mentor_paid"), {
    status: "read", studentLastReadAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
});

// ---------------- public catalogue ----------------

test("anyone can read courses, paths, active cohorts and site config", async () => {
  const anon = db(null);
  await assertSucceeds(getDocs(collection(anon, "courses")));
  await assertSucceeds(getDocs(collection(anon, "paths")));
  await assertSucceeds(getDocs(collection(anon, "activeCohorts")));
  await assertSucceeds(getDoc(doc(anon, "config/app")));
});

test("students cannot write catalogue data", async () => {
  await assertFails(setDoc(doc(db("paid"), "courses/x"), {title: "Hack"}));
  await assertFails(setDoc(doc(db("paid"), "config/app"), {apkUrl: "https://evil"}));
});
