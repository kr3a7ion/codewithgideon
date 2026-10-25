// Admin-only student actions: add, delete, edit profile, move cohort or
// course, private notes and watch progress.
import { collection, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "./firebase";

export type NewStudent = { fullName: string; email: string; phone: string; pathId: string };
export type CreatedStudent = { uid: string; existingAccount: boolean; setPasswordLink: string };

const callableMessage = (err: any, fallback: string) => {
  const msg = String(err?.message || "").replace(/^Firebase(Error)?:\s*/i, "").trim();
  return msg && !/^internal$/i.test(msg) ? msg : fallback;
};

export const adminStudents = {
  async create(input: NewStudent): Promise<CreatedStudent> {
    try {
      const res: any = await httpsCallable(functions, "adminCreateStudent")(input);
      return res.data as CreatedStudent;
    } catch (err) {
      throw new Error(callableMessage(err, "Couldn't add the student. Try again."));
    }
  },

  /** Removes the profile, payments, progress, chat and (by default) the sign-in. */
  async remove(uid: string, deleteAccount = true): Promise<string[]> {
    try {
      const res: any = await httpsCallable(functions, "adminDeleteStudent")({ uid, deleteAccount });
      return (res.data?.removed as string[]) || [];
    } catch (err) {
      throw new Error(callableMessage(err, "Couldn't delete the student. Try again."));
    }
  },

  async updateProfile(uid: string, patch: { fullName?: string; phone?: string }) {
    const update: Record<string, any> = { updatedAt: Date.now() };
    if (patch.fullName != null) {
      const v = patch.fullName.replace(/\s+/g, " ").trim();
      if (v.length < 2) throw new Error("Enter a name with at least 2 letters.");
      update.fullName = v.slice(0, 120);
    }
    if (patch.phone != null) {
      const v = patch.phone.trim();
      if (v.replace(/\D/g, "").length < 7) throw new Error("Enter a phone number with at least 7 digits.");
      update.phone = v.slice(0, 30);
    }
    await updateDoc(doc(db, "users", uid), update);
  },

  /** Put a student in another cohort (and optionally another course). Weeks stay as they are. */
  async move(
    uid: string,
    to: {
      cohort: { cohortId: string; cohortKey: string; label: string } | null;
      course?: { id: string; pathId: string; title: string; weeks: number; pricePerWeek: number } | null;
    },
  ) {
    const update: Record<string, any> = { updatedAt: Date.now() };
    if (to.cohort) {
      update.cohortId = to.cohort.cohortId;
      update.cohortKey = to.cohort.cohortKey;
      update.cohortLabel = to.cohort.label;
    } else {
      update.cohortId = deleteField();
      update.cohortKey = deleteField();
      update.cohortLabel = deleteField();
    }
    if (to.course) {
      update.courseId = to.course.id;
      update.pathId = to.course.pathId;
      update.path = to.course.title;
      if (to.course.weeks > 0) update.courseDurationWeeks = Math.min(52, Math.floor(to.course.weeks));
      if (to.course.pricePerWeek > 0) update.weeklyRate = to.course.pricePerWeek;
    }
    await updateDoc(doc(db, "users", uid), update);
  },

  async getNotes(uid: string): Promise<{ text: string; updatedAt: number; updatedBy: string }> {
    const snap = await getDoc(doc(db, "adminNotes", uid));
    const d: any = snap.exists() ? snap.data() : {};
    return { text: String(d?.text || ""), updatedAt: Number(d?.updatedAt || 0), updatedBy: String(d?.updatedBy || "") };
  },

  async saveNotes(uid: string, text: string) {
    await setDoc(doc(db, "adminNotes", uid), {
      text: text.slice(0, 5000),
      updatedAt: Date.now(),
      updatedBy: auth.currentUser?.email || "admin",
    });
  },

  /** Watch progress per class (users/{uid}/progress), keyed by session id. */
  async getProgress(uid: string): Promise<Record<string, { position: number; duration: number; completed: boolean }>> {
    const snap = await getDocs(collection(db, "users", uid, "progress"));
    const out: Record<string, { position: number; duration: number; completed: boolean }> = {};
    snap.docs.forEach((d: any) => {
      const v = d.data() || {};
      out[d.id] = { position: Number(v.position || 0), duration: Number(v.duration || 0), completed: !!v.completed };
    });
    return out;
  },
};
