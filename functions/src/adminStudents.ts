/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin-only student management:
 *   - adminCreateStudent: make an account + profile for someone who signed up
 *     in person or on WhatsApp, and return a link for them to set a password.
 *   - adminDeleteStudent: remove a student completely (profile, payments,
 *     watch progress, chat, screenshots and, optionally, their sign-in).
 *
 * Both check the caller is in `admins`. Firestore rules don't apply to the
 * Admin SDK, so inputs are validated here.
 */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getStorage} from "firebase-admin/storage";
import {db, adminAuth} from "./admin.js";

const SITE = "https://codewithgideon.com";

const clean = (v: unknown, max = 200): string =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export type NewStudentInput = {
  fullName: string;
  email: string;
  phone: string;
  pathId: string;
};

/**
 * Checks the add-student form. Returns the cleaned values or an error
 * message safe to show the admin.
 */
export const cleanNewStudent = (
  raw: any,
): {ok: true; value: NewStudentInput} | {ok: false; error: string} => {
  const fullName = clean(raw?.fullName, 120);
  const email = clean(raw?.email, 200).toLowerCase();
  const phone = clean(raw?.phone, 30);
  const pathId = clean(raw?.pathId, 120);
  if (fullName.length < 2) return {ok: false, error: "Enter the student's full name."};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {ok: false, error: "Enter a valid email address."};
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return {ok: false, error: "Enter a phone number with at least 7 digits."};
  }
  if (!pathId) return {ok: false, error: "Choose a course."};
  return {ok: true, value: {fullName, email, phone, pathId}};
};

/**
 * The profile a new student starts with: waiting to pay, on the course's
 * first weeks. Matches the shape the registration form writes, so the
 * student can later edit it under the normal rules.
 */
export const newStudentProfile = (input: {
  uid: string;
  student: NewStudentInput;
  pathTitle: string;
  course: {id: string; weeks: number; pricePerWeek: number} | null;
  now: number;
}): Record<string, any> => {
  const max = Math.min(52, Math.max(0, Math.floor(input.course?.weeks || 0)));
  const rate = Math.max(0, Math.floor(input.course?.pricePerWeek || 0));
  const weeks = max ? Math.min(4, max) : 4;
  const profile: Record<string, any> = {
    uid: input.uid,
    role: "student",
    status: "Pending",
    timestamp: input.now,
    fullName: input.student.fullName,
    email: input.student.email,
    phone: input.student.phone,
    ageRange: "Not given",
    gender: "Not given",
    weeksToCommit: weeks,
    totalPrice: weeks * rate,
    path: input.pathTitle,
    pathId: input.student.pathId,
    updatedAt: input.now,
  };
  if (input.course?.id) profile.courseId = input.course.id;
  if (max) profile.courseDurationWeeks = max;
  if (rate) profile.weeklyRate = rate;
  return profile;
};

const requireAdmin = async (uid: string | undefined): Promise<string> => {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in as an admin.");
  const snap = await db.collection("admins").doc(uid).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "Admins only.");
  return uid;
};

export const adminCreateStudent = onCall(async (request) => {
  const callerUid = await requireAdmin(request.auth?.uid);
  const checked = cleanNewStudent(request.data);
  if (!checked.ok) throw new HttpsError("invalid-argument", checked.error);
  const student = checked.value;

  const pathSnap = await db.collection("paths").doc(student.pathId).get();
  if (!pathSnap.exists) {
    throw new HttpsError("not-found", "That course path no longer exists.");
  }
  const pathTitle = clean(pathSnap.data()?.title, 120) || "Course";

  const courseSnap = await db
    .collection("courses")
    .where("pathId", "==", student.pathId)
    .get();
  const courseDoc = courseSnap.docs
    .filter((d) => d.data()?.isActive !== false)
    .sort((a, b) => Number(a.data()?.createdAt || 0) - Number(b.data()?.createdAt || 0))[0];
  const course = courseDoc ? {
    id: courseDoc.id,
    weeks: Number(courseDoc.data()?.weeks || 0),
    pricePerWeek: Number(courseDoc.data()?.pricePerWeek || 0),
  } : null;

  // Reuse a sign-in that has no profile yet (e.g. they tried Google once).
  let uid = "";
  let existingAccount = false;
  try {
    const existing = await adminAuth.getUserByEmail(student.email);
    uid = existing.uid;
    existingAccount = true;
  } catch (err: any) {
    if (err?.code !== "auth/user-not-found") {
      logger.error("adminCreateStudent lookup failed", err);
      throw new HttpsError("internal", "Couldn't check that email. Try again.");
    }
  }

  if (uid) {
    const [profile, admin] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("admins").doc(uid).get(),
    ]);
    if (admin.exists) {
      throw new HttpsError("already-exists", "That email belongs to an admin.");
    }
    if (profile.exists) {
      throw new HttpsError(
        "already-exists",
        "A student with this email already exists. Search for them on the Students page.",
      );
    }
  } else {
    const created = await adminAuth.createUser({
      email: student.email,
      displayName: student.fullName,
      emailVerified: false,
    });
    uid = created.uid;
  }

  await db.collection("users").doc(uid).set(
    newStudentProfile({uid, student, pathTitle, course, now: Date.now()}),
  );

  let setPasswordLink = "";
  try {
    setPasswordLink = await adminAuth.generatePasswordResetLink(student.email, {
      url: `${SITE}/student/login`,
    });
  } catch (err) {
    // The account still works with Google or "Forgot password".
    logger.warn("adminCreateStudent: no reset link", err);
  }

  logger.info("Admin created student", {callerUid, uid, existingAccount});
  return {uid, existingAccount, setPasswordLink};
});

export const adminDeleteStudent = onCall(async (request) => {
  const callerUid = await requireAdmin(request.auth?.uid);
  const uid = clean(request.data?.uid, 128);
  const deleteAccount = request.data?.deleteAccount !== false;
  if (!uid) throw new HttpsError("invalid-argument", "Which student?");
  if (uid === callerUid) {
    throw new HttpsError("failed-precondition", "You can't delete your own account.");
  }
  const admin = await db.collection("admins").doc(uid).get();
  if (admin.exists) {
    throw new HttpsError("failed-precondition", "That account is an admin.");
  }

  const removed: string[] = [];
  await db.recursiveDelete(db.collection("users").doc(uid));
  await db.collection("adminNotes").doc(uid).delete();
  removed.push("profile, payments and watch progress");

  const threadId = `mentor_${uid.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
  await db.recursiveDelete(db.collection("mentorThreads").doc(threadId));
  removed.push("chat");

  try {
    await getStorage().bucket().deleteFiles({prefix: `mentor-uploads/${uid}/`});
    removed.push("screenshots");
  } catch (err) {
    logger.warn("adminDeleteStudent: storage cleanup skipped", err);
  }

  if (deleteAccount) {
    try {
      await adminAuth.deleteUser(uid);
      removed.push("sign-in");
    } catch (err: any) {
      if (err?.code !== "auth/user-not-found") {
        logger.error("adminDeleteStudent: auth delete failed", err);
        throw new HttpsError(
          "internal",
          "Their data was removed but the sign-in couldn't be deleted. Try again.",
        );
      }
    }
  }

  logger.info("Admin deleted student", {callerUid, uid, removed});
  return {ok: true, removed};
});
