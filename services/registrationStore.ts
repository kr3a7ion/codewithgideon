// services/registrationStore.ts
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
  where,
  Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

// ✅ allow UI to send ms number / ISO string / Timestamp
type TimestampLike = Timestamp | number | string;

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

/** ✅ syllabus stored in course doc */
export type SyllabusWeek = {
  week: number; // 1..N
  title: string;
  topics: string[];
};

export type CohortDoc = {
  id: string;
  label: string;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CourseDoc = {
  id: string;
  title: string;
  duration: string; // e.g. "12 Weeks"
  sessions: string;
  level: string;
  description: string;
  priceLabel?: string; // e.g. "₦10k/wk"
  imageUrl?: string;
  syllabusView?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;

  /** optional truth fields */
  weeks?: number;
  pricePerWeek?: number;
  syllabus?: SyllabusWeek[];
};

export type SessionDoc = {
  id: string;

  // ✅ REQUIRED for student unlock logic
  week: number; // 1..N
  path: string; // must match RegistrationEntry.path
  isPublished: boolean;

  title: string;

  // ✅ Store as Firestore Timestamp for proper ordering/querying
  startsAt: Timestamp;
  endsAt?: Timestamp;

  joinUrl?: string;
  durationMins?: number;
  notes?: string;

  createdAt: number;
  updatedAt: number;
};

export type SessionInput = Omit<
  SessionDoc,
  "id" | "createdAt" | "updatedAt" | "startsAt" | "endsAt"
> & {
  startsAt: TimestampLike;
  endsAt?: TimestampLike;
};

// ✅ FIX: Admin can patch with number/string too
export type SessionPatch = Partial<
  Omit<SessionDoc, "id" | "createdAt" | "updatedAt" | "startsAt" | "endsAt">
> & {
  startsAt?: TimestampLike;
  endsAt?: TimestampLike | null; // null clears endsAt
};

type CourseInput = Omit<CourseDoc, "id" | "createdAt" | "updatedAt">;
type CoursePatch = Partial<Omit<CourseDoc, "id" | "createdAt" | "updatedAt">>;

const coursesColRef = collection(db, "courses");
const cohortsColRef = collection(db, "cohorts");
const usersColRef = collection(db, "users");

export type ActiveCohort = { id: string; label: string };

type NewStudentEntry = Omit<
  RegistrationEntry,
  "uid" | "role" | "status" | "timestamp"
>;

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

    // ✅ Use cohort coming from Registration. Fallback to active cohort.
    let cohortId = (entry as any).cohortId;
    let cohortLabel = (entry as any).cohortLabel;

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

  async setActiveCohort(id: string, label: string): Promise<void> {
    await setDoc(
      doc(db, "config", "app"),
      {
        activeCohortId: String(id || "").trim(),
        activeCohortLabel: String(label || "").trim(),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  },

  // =========================
  // COHORTS (Admin-managed)
  // =========================
  async getCohorts(): Promise<CohortDoc[]> {
    const snap = await getDocs(
      query(collection(db, "cohorts"), orderBy("createdAt", "desc")),
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as CohortDoc[];
  },

  async addCohort(input: {
    id?: string;
    label: string;
    isActive?: boolean;
  }): Promise<string> {
    const payload = {
      label: String(input.label || "").trim(),
      isActive: input.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (input.id && String(input.id).trim().length > 2) {
      const id = String(input.id).trim();
      await setDoc(doc(db, "cohorts", id), payload, { merge: false });
      return id;
    }

    const ref = await addDoc(collection(db, "cohorts"), payload);
    return ref.id;
  },

  async updateCohort(
    cohortId: string,
    patch: Partial<Omit<CohortDoc, "id" | "createdAt">>,
  ): Promise<void> {
    const cleanPatch: any = { updatedAt: Date.now() };
    if (patch.label !== undefined)
      cleanPatch.label = String(patch.label).trim();
    if (patch.isActive !== undefined) cleanPatch.isActive = !!patch.isActive;
    await updateDoc(doc(db, "cohorts", cohortId), cleanPatch);
  },

  async deleteCohort(cohortId: string): Promise<void> {
    await deleteDoc(doc(db, "cohorts", cohortId));
  },

  // =========================
  // COHORT SESSIONS (Admin-managed)
  // /cohorts/{cohortId}/sessions/{sessionId}
  // =========================

  _sessionsCol(cohortId: string) {
    return collection(db, "cohorts", cohortId, "sessions");
  },

  _toTimestamp(input: TimestampLike): Timestamp {
    if (!input) throw new Error("startsAt is required");
    if (input instanceof Timestamp) return input;

    if (typeof input === "number") return Timestamp.fromMillis(input);

    if (typeof input === "string") {
      const d = new Date(input);
      if (isNaN(d.getTime()))
        throw new Error("Invalid date string for startsAt");
      return Timestamp.fromDate(d);
    }

    if (
      (input as any)?.toMillis &&
      typeof (input as any).toMillis === "function"
    )
      return input as any as Timestamp;

    throw new Error("Invalid startsAt format");
  },

  _sanitizeSessionInput(
    input: any,
  ): Omit<SessionDoc, "id" | "createdAt" | "updatedAt"> {
    const week = Number(input.week);
    if (!Number.isFinite(week) || week < 1)
      throw new Error("Session week must be >= 1.");

    const path = String(input.path || "").trim();
    if (!path) throw new Error("Session path is required.");

    const title = String(input.title || "").trim();
    if (!title) throw new Error("Session title is required.");

    const isPublished = !!input.isPublished;

    const startsAt = this._toTimestamp(input.startsAt);

    let endsAt: Timestamp | undefined = undefined;
    if (input.endsAt) endsAt = this._toTimestamp(input.endsAt);

    const joinUrl = input.joinUrl ? String(input.joinUrl).trim() : "";
    const durationMins =
      input.durationMins !== undefined
        ? Math.max(15, Math.floor(Number(input.durationMins)))
        : 60;
    const notes = input.notes ? String(input.notes).trim() : "";

    return {
      week: Math.floor(week),
      path,
      isPublished,
      title,
      startsAt,
      endsAt,
      joinUrl,
      durationMins,
      notes,
    };
  },

  async getCohortSessions(cohortId: string): Promise<SessionDoc[]> {
    const snap = await getDocs(
      query(
        this._sessionsCol(cohortId),
        orderBy("week", "asc"),
        orderBy("startsAt", "asc"),
      ),
    );

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as SessionDoc[];
  },

  async addCohortSession(
    cohortId: string,
    input: SessionInput,
  ): Promise<string> {
    const clean = this._sanitizeSessionInput(input);

    const ref = await addDoc(this._sessionsCol(cohortId), {
      ...clean,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return ref.id;
  },

  async updateCohortSession(
    cohortId: string,
    sessionId: string,
    patch: SessionPatch,
  ): Promise<void> {
    const clean: any = { updatedAt: Date.now() };

    if (patch.week !== undefined) {
      const w = Number(patch.week);
      if (!Number.isFinite(w) || w < 1) throw new Error("Week must be >= 1.");
      clean.week = Math.floor(w);
    }

    if (patch.path !== undefined) clean.path = String(patch.path || "").trim();
    if (patch.title !== undefined)
      clean.title = String(patch.title || "").trim();
    if (patch.joinUrl !== undefined)
      clean.joinUrl = String(patch.joinUrl || "").trim();
    if (patch.isPublished !== undefined)
      clean.isPublished = !!patch.isPublished;

    if (patch.durationMins !== undefined) {
      clean.durationMins = Math.max(15, Math.floor(Number(patch.durationMins)));
    }

    if (patch.notes !== undefined)
      clean.notes = String(patch.notes || "").trim();

    // ✅ accepts number/string/timestamp
    if (patch.startsAt !== undefined) {
      clean.startsAt = this._toTimestamp(patch.startsAt);
    }

    // ✅ allow clearing endsAt
    if (patch.endsAt !== undefined) {
      if (
        patch.endsAt === null ||
        patch.endsAt === "" ||
        (patch as any).endsAt === false
      ) {
        clean.endsAt = deleteField();
      } else {
        clean.endsAt = this._toTimestamp(patch.endsAt as TimestampLike);
      }
    }

    await updateDoc(doc(db, "cohorts", cohortId, "sessions", sessionId), clean);
  },

  async deleteCohortSession(
    cohortId: string,
    sessionId: string,
  ): Promise<void> {
    await deleteDoc(doc(db, "cohorts", cohortId, "sessions", sessionId));
  },

  // =========================
  // PENDING PAYMENTS (Admin actions)
  // =========================
  async approveInitialPayment(
    uid: string,
    amount: number,
    weeks: number,
    reference: string,
  ): Promise<void> {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      status: "Complete",
      pendingPayment: deleteField(),
    });

    await addDoc(collection(db, "users", uid, "payments"), {
      kind: "initial",
      amount,
      weeks,
      reference,
      timestamp: Date.now(),
    });
  },

  async approveTopUpFromPending(
    uid: string,
    pending: { weeks: number; amount: number; reference: string },
  ): Promise<void> {
    await this.recordTopUp(
      uid,
      pending.weeks,
      pending.amount,
      pending.reference,
    );
  },

  // =========================
  // COURSES (Admin-managed)
  // =========================
  _sanitizeSyllabus(raw: any, weeksHint?: number): SyllabusWeek[] {
    const safeWeeks =
      Number.isFinite(weeksHint) && (weeksHint as number) > 0
        ? Math.floor(weeksHint as number)
        : undefined;

    if (!Array.isArray(raw)) return [];

    const cleaned = raw
      .filter(Boolean)
      .map((w: any, idx: number) => {
        const title = String(w?.title || "").trim();
        const topics = Array.isArray(w?.topics)
          ? w.topics.map((t: any) => String(t).trim()).filter(Boolean)
          : [];
        return { week: idx + 1, title, topics } as SyllabusWeek;
      })
      .filter((w: SyllabusWeek) => w.title.length > 0 || w.topics.length > 0);

    if (safeWeeks) return cleaned.slice(0, safeWeeks);
    return cleaned;
  },

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
    const weeks =
      input.weeks !== undefined &&
      Number.isFinite(input.weeks) &&
      (input.weeks as number) > 0
        ? Math.floor(input.weeks as number)
        : undefined;

    const pricePerWeek =
      input.pricePerWeek !== undefined &&
      Number.isFinite(input.pricePerWeek) &&
      (input.pricePerWeek as number) >= 0
        ? Math.floor(input.pricePerWeek as number)
        : undefined;

    const syllabus = this._sanitizeSyllabus((input as any).syllabus, weeks);

    const cleanPayload: any = {
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

    if (weeks !== undefined) cleanPayload.weeks = weeks;
    if (pricePerWeek !== undefined) cleanPayload.pricePerWeek = pricePerWeek;
    if (syllabus.length > 0) cleanPayload.syllabus = syllabus;

    const ref = await addDoc(collection(db, "courses"), cleanPayload);
    return ref.id;
  },

  async updateCourse(courseId: string, patch: CoursePatch): Promise<void> {
    const cleanPatch: any = { updatedAt: Date.now() };

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

    if (patch.weeks !== undefined) {
      const w = Number(patch.weeks);
      if (Number.isFinite(w) && w > 0) cleanPatch.weeks = Math.floor(w);
    }

    if (patch.pricePerWeek !== undefined) {
      const p = Number(patch.pricePerWeek);
      if (Number.isFinite(p) && p >= 0) cleanPatch.pricePerWeek = Math.floor(p);
    }

    if ((patch as any).syllabus !== undefined) {
      const weeksHint =
        cleanPatch.weeks !== undefined
          ? cleanPatch.weeks
          : patch.weeks !== undefined
            ? Number(patch.weeks)
            : undefined;

      cleanPatch.syllabus = this._sanitizeSyllabus(
        (patch as any).syllabus,
        weeksHint,
      );
    }

    await updateDoc(doc(db, "courses", courseId), cleanPatch);
  },

  async deleteCourse(courseId: string): Promise<void> {
    await deleteDoc(doc(db, "courses", courseId));
  },

  // ✅ Student helper: get sessions unlocked by paid weeks (published only)
  async getUnlockedSessionsForStudent(
    profile: RegistrationEntry,
  ): Promise<SessionDoc[]> {
    const cohortId = profile.cohortId || (await this.getActiveCohort()).id;
    const paidWeeks = Math.max(0, Number(profile.weeksToCommit || 0));
    if (!cohortId || paidWeeks <= 0) return [];

    const snap = await getDocs(
      query(
        this._sessionsCol(cohortId),
        where("path", "==", profile.path),
        where("isPublished", "==", true),
        where("week", "<=", paidWeeks),
        orderBy("week", "asc"),
        orderBy("startsAt", "asc"),
      ),
    );

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as SessionDoc[];
  },
};
