import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  getDoc,
  query,
  deleteDoc,
  increment,
  addDoc,
  deleteField,
  orderBy,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

export interface PendingPayment {
  kind: "initial" | "topup";
  status: "Pending";
  weeks: number;
  amount: number;
  reference: string;
  createdAt: number;
}

export interface RegistrationEntry {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  path: string;
  ageRange: string;
  gender: string;
  weeksToCommit: number;
  totalPrice: number;
  status: "Pending" | "Complete";
  role: "student" | "admin";
  timestamp: number;
  cohortId?: string;
  cohortLabel?: string;
  pendingPayment?: PendingPayment;
}

export type CourseDoc = {
  id: string;
  title: string;
  duration: string;
  sessions: string;
  level: string;
  description: string;
  priceLabel?: string;
  imageUrl?: string;
  syllabusView?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
};

type CourseInput = Omit<CourseDoc, "id" | "createdAt" | "updatedAt">;
type CoursePatch = Partial<Omit<CourseDoc, "id" | "createdAt" | "updatedAt">>;

const coursesColRef = collection(db, "courses");

export type ActiveCohort = { id: string; label: string };

const usersColRef = collection(db, "users");

type NewStudentEntry = Omit<
  RegistrationEntry,
  "uid" | "role" | "status" | "timestamp"
>;

type NewCourseInput = Omit<CourseDoc, "id" | "createdAt" | "updatedAt">;

export const registrationStore = {
  // ✅ Always pull from Firestore config/app
  async getActiveCohort(): Promise<{ id: string; label: string }> {
    try {
      const ref = doc(db, "config", "app");
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.warn("config/app missing");
        return { id: "CWG-DEFAULT", label: "Current Cohort" };
      }

      const data = snap.data() as any;

      const id = data?.activeCohortId;
      const label = data?.activeCohortLabel;

      if (!id || !label) {
        console.warn("config/app fields missing:", data);
        return { id: "CWG-DEFAULT", label: "Current Cohort" };
      }

      return { id, label };
    } catch (e) {
      console.error("getActiveCohort failed:", e);
      return { id: "CWG-DEFAULT", label: "Current Cohort" };
    }
  },

  async updateUserCohort(uid: string, cohortId: string, cohortLabel: string) {
    await updateDoc(doc(db, "users", uid), { cohortId, cohortLabel });
  },

  // ✅ Register (Auth) + profile (Firestore)
  // IMPORTANT: do NOT overwrite cohort if UI already provided it.
  async createAccount(
    entry: NewStudentEntry,
    password: string,
  ): Promise<string> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      entry.email,
      password,
    );

    const user = userCredential.user;

    // ✅ Use cohort coming from Registration.
    // If not provided (edge case), fallback to Firestore.
    let cohortId = entry.cohortId;
    let cohortLabel = entry.cohortLabel;

    if (!cohortId || !cohortLabel) {
      const active = await this.getActiveCohort();
      cohortId = active.id;
      cohortLabel = active.label;
    }

    const profile: RegistrationEntry = {
      ...(entry as any),
      uid: user.uid,
      role: "student",
      status: "Pending",
      timestamp: Date.now(),
      cohortId,
      cohortLabel,
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return user.uid;
  },

  async login(email: string, password: string): Promise<string> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  },

  async setPendingPayment(
    uid: string,
    pending: {
      kind: "initial" | "topup";
      weeks: number;
      amount: number;
      reference: string;
    },
  ): Promise<void> {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      pendingPayment: {
        kind: pending.kind,
        status: "Pending",
        weeks: pending.weeks,
        amount: pending.amount,
        reference: pending.reference,
        createdAt: Date.now(),
      },
    });
  },

  async clearPendingPayment(uid: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { pendingPayment: deleteField() });
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getAll(): Promise<RegistrationEntry[]> {
    const snap = await getDocs(query(usersColRef));
    return snap.docs.map((d) => {
      const data = d.data() as RegistrationEntry;
      return { ...data, uid: data.uid || d.id };
    });
  },

  async updateStatus(
    uid: string,
    status: "Pending" | "Complete",
  ): Promise<void> {
    await updateDoc(doc(db, "users", uid), { status });
  },

  async recordTopUp(
    uid: string,
    additionalWeeks: number,
    amount: number,
    reference: string,
  ): Promise<void> {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      weeksToCommit: increment(additionalWeeks),
      status: "Complete",
      pendingPayment: deleteField(),
    });

    await addDoc(collection(db, "users", uid, "payments"), {
      amount,
      weeks: additionalWeeks,
      reference,
      timestamp: Date.now(),
    });
  },

  async delete(uid: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid));
  },

  async clearAll(): Promise<void> {
    const snap = await getDocs(usersColRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },

  // =========================
  // COURSES (Admin-managed)
  // =========================
  async getCourses(): Promise<CourseDoc[]> {
    const snap = await getDocs(
      query(coursesColRef, orderBy("createdAt", "asc")),
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as CourseDoc[];
  },

  async addCourse(input: CourseInput): Promise<string> {
    const cleanPayload = {
      title: String(input.title || "").trim(),
      duration: String(input.duration || "").trim(),
      sessions: String(input.sessions || "").trim(),
      level: String(input.level || "").trim(),
      description: String(input.description || "").trim(),
      priceLabel: String(input.priceLabel || ""),
      imageUrl: String(input.imageUrl || ""),
      syllabusView: String(input.syllabusView || ""),
      isActive: input.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    console.log("createdAt int?", Number.isInteger(cleanPayload.createdAt));
    console.log("updatedAt int?", Number.isInteger(cleanPayload.updatedAt));
    console.log("COURSE PAYLOAD KEYS:", Object.keys(cleanPayload));
    console.log("COURSE PAYLOAD FULL:", cleanPayload);

    const ref = await addDoc(collection(db, "courses"), cleanPayload);
    return ref.id;
  },

  async updateCourse(courseId: string, patch: CoursePatch): Promise<void> {
    // ✅ sanitize + block illegal fields implicitly by type
    const cleanPatch: any = {
      updatedAt: Date.now(),
    };

    if (patch.title !== undefined)
      cleanPatch.title = String(patch.title).trim();
    if (patch.duration !== undefined)
      cleanPatch.duration = String(patch.duration).trim();
    if (patch.sessions !== undefined)
      cleanPatch.sessions = String(patch.sessions).trim();
    if (patch.level !== undefined)
      cleanPatch.level = String(patch.level).trim();
    if (patch.description !== undefined)
      cleanPatch.description = String(patch.description).trim();
    if (patch.priceLabel !== undefined)
      cleanPatch.priceLabel = String(patch.priceLabel);
    if (patch.imageUrl !== undefined)
      cleanPatch.imageUrl = String(patch.imageUrl);
    if (patch.syllabusView !== undefined)
      cleanPatch.syllabusView = String(patch.syllabusView);
    if (patch.isActive !== undefined) cleanPatch.isActive = !!patch.isActive;

    await updateDoc(doc(db, "courses", courseId), cleanPatch);
  },

  async deleteCourse(courseId: string): Promise<void> {
    await deleteDoc(doc(db, "courses", courseId));
  },
};
