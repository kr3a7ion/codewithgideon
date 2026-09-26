import { db, auth, setAuthPersistenceMode } from "./firebase";
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
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  reload,
} from "firebase/auth";

function waitForAuthUid(auth: any, expectedUid: string, timeoutMs = 8000) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid === expectedUid) {
        unsub();
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        unsub();
        reject(new Error("Auth state not attached yet"));
      }
    });
  });
}

class PendingGoogleLinkError extends Error {
  code = "auth/account-exists-with-different-credential";
  requiresPasswordLink = false;
  signInMethods: string[];
  email: string;

  constructor(email: string, signInMethods: string[]) {
    const methods = signInMethods.map((item) => item.toLowerCase());
    const requiresPasswordLink = methods.includes("password");
    super(
      requiresPasswordLink
        ? "This email already has a password login. Sign in with your password once and we will connect Google automatically for your next login."
        : "This email already uses another sign-in method. Use that sign-in method first, then try Google again.",
    );
    this.name = "PendingGoogleLinkError";
    this.email = email;
    this.signInMethods = signInMethods;
    this.requiresPasswordLink = requiresPasswordLink;
  }
}

type PendingGoogleLinkState = {
  email: string;
  credential: ReturnType<typeof GoogleAuthProvider.credentialFromError>;
  signInMethods: string[];
} | null;

let pendingGoogleLink: PendingGoogleLinkState = null;

// ✅ allow UI to send ms number / ISO string / Timestamp
type TimestampLike = Timestamp | number | string;

// ✅ removes undefined keys so Firestore never crashes
const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
};

export interface PendingPayment {
  kind: "initial" | "topup";
  status: "Pending";
  weeks: number;
  amount: number;
  reference: string;
  createdAt: number;
}

/**
 * ✅ NEW: Path docs (tracks) live in /paths
 * This is the source of truth for available learning tracks.
 */
export type PathDoc = {
  id: string; // Firestore doc id (stable)
  title: string; // human label shown in UI
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
};

type PathInput = {
  title: string;
  isActive?: boolean;
};

type PathPatch = Partial<PathInput>;

/**
 * ✅ RegistrationEntry (backward-compatible)
 * - Keep `path` string for existing flows.
 * - Add `pathId` for re-engineered, data-driven flows.
 * - Add optional `courseId` for future “specific course enrollment”.
 */
export interface RegistrationEntry {
  uid: string;
  fullName: string;
  email: string;
  phone: string;

  // ✅ legacy string label (keep)
  path: string;

  // ✅ new (preferred)
  pathId?: string;
  courseId?: string;

  ageRange: string;
  gender: string;
  weeksToCommit: number;
  totalPrice: number;
  status: "Pending" | "Complete";
  role: "student" | "admin";
  timestamp: number;

  // ✅ cohort grouping fields
  cohortId?: string; // stable id e.g. FLUTTER
  cohortLabel?: string; // human label e.g. "March 2026 Cohort"
  cohortKey?: string; // unique schedule key e.g. FLUTTER-2026-03
  courseDurationWeeks?: number;
  weeklyRate?: number;

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

  // ✅ optional metadata (safe to add)
  path?: string; // legacy label
  pathId?: string; // preferred
  cohortId?: string;
  cohortKey?: string;

  createdAt: number;
  updatedAt: number;
};

export type CourseDoc = {
  id: string;

  // ✅ pathId for grouping/filtering (optional to keep old docs working)
  pathId?: string;

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

  // legacy
  isActive: boolean;

  // ✅ visibility flags
  showOnLanding?: boolean;
  showInExplore?: boolean;

  /** optional truth fields */
  weeks?: number;
  pricePerWeek?: number;
  syllabus?: SyllabusWeek[];
};

export type ResourceDoc = {
  id: string;
  name: string;
  type: string;
  size: string;
  folder: string;
  url: string;
  description?: string;
  pathId?: string;
  courseId?: string;
  sessionId?: string;
  sessionWeek?: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CommunitySpaceDoc = {
  id: string;
  title: string;
  description: string;
  cohortId?: string;
  cohortLabel?: string;
  pathId?: string;
  roomUrl?: string;
  ctaLabel?: string;
  category?: string;
  icon?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type SessionDoc = {
  id: string;

  week: number; // 1..N

  // ✅ legacy string matching (kept)
  path: string;

  // ✅ preferred key for matching (new)
  pathId?: string;

  isPublished: boolean;

  title: string;

  startsAt: Timestamp;
  endsAt?: Timestamp;

  joinUrl?: string;
  recordingUrl?: string;
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

export type SessionPatch = Partial<
  Omit<SessionDoc, "id" | "createdAt" | "updatedAt" | "startsAt" | "endsAt">
> & {
  startsAt?: TimestampLike;
  endsAt?: TimestampLike | null; // null clears endsAt
};

type CourseInput = Omit<CourseDoc, "id" | "createdAt" | "updatedAt">;
type CoursePatch = Partial<Omit<CourseDoc, "id" | "createdAt" | "updatedAt">>;
type ResourceInput = Omit<ResourceDoc, "id" | "createdAt" | "updatedAt">;
type ResourcePatch = Partial<
  Omit<ResourceDoc, "id" | "createdAt" | "updatedAt">
>;
type CommunitySpaceInput = Omit<
  CommunitySpaceDoc,
  "id" | "createdAt" | "updatedAt"
>;
type CommunitySpacePatch = Partial<
  Omit<CommunitySpaceDoc, "id" | "createdAt" | "updatedAt">
>;

const coursesColRef = collection(db, "courses");
const resourcesColRef = collection(db, "resources");
const communitySpacesColRef = collection(db, "communitySpaces");
const usersColRef = collection(db, "users");
const pathsColRef = collection(db, "paths");

type NewStudentEntry = Omit<
  RegistrationEntry,
  | "uid"
  | "role"
  | "status"
  | "timestamp"
  | "cohortId"
  | "cohortLabel"
  | "cohortKey"
>;

export type ActiveCohortForPath = {
  // legacy
  path: string;
  pathKey: string;

  // new
  pathId?: string;

  cohortId: string; // e.g. FLUTTER
  cohortKey: string; // e.g. FLUTTER-2026-03
  label: string; // e.g. March 2026 Cohort
  seasonKey: string; // e.g. 2026-03
  updatedAt?: any;
};

export type CohortMessageDoc = {
  id: string;
  cohortId: string;
  cohortLabel: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sentAt: any;
  sentBy?: string;
  status: "sent";
};

export const registrationStore = {
  // -------------------------
  // PATH + COHORT HELPERS
  // -------------------------
  pathKey(path: string): string {
    return String(path || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  },

  async getUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...(snap.data() as any) } as RegistrationEntry;
  },

  /**
   * ✅ Legacy mapping (kept for backward-compat)
   * Used ONLY when pathId is missing.
   */
  computeCohortIdFromPath(path: string): string {
    const p = String(path || "").toLowerCase();
    if (p.includes("flutter")) return "FLUTTER";
    if (p.includes("ui") && p.includes("ux")) return "UIUX";
    if (p.includes("wordpress")) return "WORDPRESS";
    if (p.includes("web")) return "WEB";
    if (p.includes("ai")) return "AI";
    const cleaned = this.pathKey(path).replace(/-/g, "").toUpperCase();
    return cleaned.slice(0, 10) || "CWG";
  },

  computeCohortKey(cohortId: string, seasonKey: string): string {
    const c = String(cohortId || "")
      .trim()
      .toUpperCase();
    const s = String(seasonKey || "").trim();
    return `${c}-${s}`;
  },

  defaultSeasonKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  },

  // -------------------------
  // PATH RESOLVERS (prevents path/pathId drift)
  // -------------------------
  async resolvePathTitle(
    pathId?: string,
    fallbackTitle?: string,
  ): Promise<string> {
    const fb = String(fallbackTitle || "").trim();
    const id = String(pathId || "").trim();
    if (!id) return fb;
    const p = await this.getPath(id);
    if (p?.title) return String(p.title).trim();
    return fb;
  },

  async resolvePathId(pathTitle?: string): Promise<string | undefined> {
    const title = String(pathTitle || "")
      .trim()
      .toLowerCase();
    if (!title) return undefined;
    const list = await this.getPaths(true);
    const found = list.find(
      (p) =>
        String(p.title || "")
          .trim()
          .toLowerCase() === title,
    );
    return found?.id;
  },

  // =========================
  // PATHS (Admin-managed)
  // =========================
  async getPaths(includeInactive = true): Promise<PathDoc[]> {
    const q = includeInactive
      ? query(pathsColRef, orderBy("createdAt", "asc"))
      : query(
          pathsColRef,
          where("isActive", "==", true),
          orderBy("createdAt", "asc"),
        );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as PathDoc[];
  },

  async addPath(input: PathInput): Promise<string> {
    const title = String(input.title || "").trim();
    if (title.length < 2) throw new Error("Path title is too short.");

    const payload = stripUndefined({
      title,
      isActive: input.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const ref = await addDoc(pathsColRef, payload);
    return ref.id;
  },

  async updatePath(pathId: string, patch: PathPatch): Promise<void> {
    const clean: any = { updatedAt: Date.now() };
    if (patch.title !== undefined)
      clean.title = String(patch.title || "").trim();
    if (patch.isActive !== undefined) clean.isActive = !!patch.isActive;
    await updateDoc(doc(db, "paths", pathId), stripUndefined(clean));
  },

  async deletePath(pathId: string): Promise<void> {
    await deleteDoc(doc(db, "paths", pathId));
  },

  async getPath(pathId: string): Promise<PathDoc | null> {
    const snap = await getDoc(doc(db, "paths", pathId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as PathDoc;
  },

  // -------------------------
  // ACTIVE COHORTS (PER PATH)
  // legacy: activeCohorts/{pathKey}
  // new:    activeCohorts/{pathId}
  // -------------------------

  /**
   * ✅ Preferred: use pathId (no string guessing)
   */
  async getActiveCohortForPathId(pathId: string): Promise<ActiveCohortForPath> {
    const pathDoc = await this.getPath(pathId);
    const pathTitle = pathDoc?.title || "Unknown Path";

    const ref = doc(db, "activeCohorts", pathId);
    const snap = await getDoc(ref);

    const fallbackSeasonKey = this.defaultSeasonKey();
    const fallbackCohortId = this.computeCohortIdFromPath(pathTitle);

    if (!snap.exists()) {
      const cohortId = fallbackCohortId;
      const seasonKey = fallbackSeasonKey;
      return {
        path: pathTitle,
        pathKey: this.pathKey(pathTitle),
        pathId,
        cohortId,
        seasonKey,
        cohortKey: this.computeCohortKey(cohortId, seasonKey),
        label: "Current Cohort",
      };
    }

    const data = snap.data() as any;

    const cohortId = String(data.cohortId || fallbackCohortId);
    const seasonKey = String(data.seasonKey || fallbackSeasonKey);

    const cohortKey =
      String(data.cohortKey || "").trim() ||
      this.computeCohortKey(cohortId, seasonKey);

    const label =
      String(data.label || "").trim() || `${cohortId} (${seasonKey})`;

    return {
      path: String(data.path || pathTitle),
      pathKey: String(data.pathKey || this.pathKey(pathTitle)),
      pathId,
      cohortId,
      seasonKey,
      cohortKey,
      label,
      updatedAt: data.updatedAt,
    };
  },

  /**
   * ✅ Preferred: set active cohort by pathId
   * ✅ ALSO sync legacy activeCohorts/{pathKey} to avoid split-brain.
   */
  async setActiveCohortForPathId(
    pathId: string,
    input: { seasonKey: string; seasonLabel: string; cohortId?: string },
  ): Promise<ActiveCohortForPath> {
    const pathDoc = await this.getPath(pathId);
    if (!pathDoc) throw new Error("Path not found. Create the path first.");

    const pathTitle = String(pathDoc.title || "").trim();
    const pathKey = this.pathKey(pathTitle);

    const cohortId = String(
      input.cohortId || this.computeCohortIdFromPath(pathTitle),
    )
      .trim()
      .toUpperCase();

    const seasonKey = String(input.seasonKey || "").trim();
    const label = String(input.seasonLabel || "").trim();

    if (!seasonKey) throw new Error("seasonKey is required (e.g. 2026-03).");
    if (!label) throw new Error("seasonLabel is required.");

    const cohortKey = this.computeCohortKey(cohortId, seasonKey);

    // new: activeCohorts/{pathId}
    await setDoc(
      doc(db, "activeCohorts", pathId),
      stripUndefined({
        pathId,
        path: pathTitle,
        pathKey,
        cohortId,
        seasonKey,
        cohortKey,
        label,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    // ✅ legacy sync: activeCohorts/{pathKey}
    await setDoc(
      doc(db, "activeCohorts", pathKey),
      stripUndefined({
        path: pathTitle,
        pathKey,
        cohortId,
        seasonKey,
        cohortKey,
        label,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    // ensure cohorts/{cohortKey} exists
    const cohortRef = doc(db, "cohorts", cohortKey);
    const cohortSnap = await getDoc(cohortRef);

    if (!cohortSnap.exists()) {
      await setDoc(
        cohortRef,
        stripUndefined({
          label,
          isActive: true,

          // metadata (safe)
          pathId,
          path: pathTitle,
          cohortId,
          cohortKey,

          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
        { merge: false },
      );
    } else {
      await updateDoc(
        cohortRef,
        stripUndefined({ label, updatedAt: Date.now() }),
      );
    }

    return {
      path: pathTitle,
      pathKey,
      pathId,
      cohortId,
      seasonKey,
      cohortKey,
      label,
    };
  },

  /**
   * ✅ Legacy (kept): path string → activeCohorts/{pathKey}
   */
  async getActiveCohortForPath(path: string): Promise<ActiveCohortForPath> {
    const pathKey = this.pathKey(path);
    const ref = doc(db, "activeCohorts", pathKey);
    const snap = await getDoc(ref);

    const fallbackSeasonKey = this.defaultSeasonKey();
    const fallbackCohortId = this.computeCohortIdFromPath(path);

    if (!snap.exists()) {
      const cohortId = fallbackCohortId;
      const seasonKey = fallbackSeasonKey;
      return {
        path,
        pathKey,
        cohortId,
        seasonKey,
        cohortKey: this.computeCohortKey(cohortId, seasonKey),
        label: "Current Cohort",
      };
    }

    const data = snap.data() as any;

    const cohortId = String(data.cohortId || fallbackCohortId);
    const seasonKey = String(data.seasonKey || fallbackSeasonKey);

    const cohortKey =
      String(data.cohortKey || "").trim() ||
      this.computeCohortKey(cohortId, seasonKey);

    const label =
      String(data.label || "").trim() || `${cohortId} (${seasonKey})`;

    return {
      path,
      pathKey,
      cohortId,
      seasonKey,
      cohortKey,
      label,
      updatedAt: data.updatedAt,
    };
  },

  async setActiveCohortForPath(
    path: string,
    input: { seasonKey: string; seasonLabel: string; cohortId?: string },
  ): Promise<ActiveCohortForPath> {
    const pathKey = this.pathKey(path);
    const cohortId = String(
      input.cohortId || this.computeCohortIdFromPath(path),
    )
      .trim()
      .toUpperCase();

    const seasonKey = String(input.seasonKey || "").trim();
    const label = String(input.seasonLabel || "").trim();

    if (!seasonKey) throw new Error("seasonKey is required (e.g. 2026-03).");
    if (!label) throw new Error("seasonLabel is required.");

    const cohortKey = this.computeCohortKey(cohortId, seasonKey);

    await setDoc(
      doc(db, "activeCohorts", pathKey),
      stripUndefined({
        path: String(path || "").trim(),
        pathKey,
        cohortId,
        seasonKey,
        cohortKey,
        label,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    // ensure cohorts/{cohortKey} exists
    const cohortRef = doc(db, "cohorts", cohortKey);
    const cohortSnap = await getDoc(cohortRef);

    if (!cohortSnap.exists()) {
      await setDoc(
        cohortRef,
        {
          label,
          isActive: true,
          path: String(path || "").trim(),
          cohortId,
          cohortKey,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: false },
      );
    } else {
      await updateDoc(cohortRef, { label, updatedAt: Date.now() });
    }

    return { path, pathKey, cohortId, seasonKey, cohortKey, label };
  },

  // -------------------------
  // LEGACY GLOBAL ACTIVE COHORT (optional)
  // -------------------------
  async getActiveCohort(): Promise<{ id: string; label: string }> {
    try {
      const ref = doc(db, "config", "app");
      const snap = await getDoc(ref);
      if (!snap.exists()) return { id: "CWG-DEFAULT", label: "Current Cohort" };
      const data = snap.data() as any;
      const id = data?.activeCohortId;
      const label = data?.activeCohortLabel;
      if (!id || !label) return { id: "CWG-DEFAULT", label: "Current Cohort" };
      return { id, label };
    } catch {
      return { id: "CWG-DEFAULT", label: "Current Cohort" };
    }
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
  // AUTH-ONLY SIGNUP (Step 1)
  // =========================
  async createAuthOnly(
    email: string,
    password: string,
  ): Promise<{ uid: string; email: string }> {
    const em = String(email || "").trim();
    if (!em) throw new Error("Email is required.");
    if (!password || String(password).length < 6)
      throw new Error("Password must be at least 6 characters.");

    await setAuthPersistenceMode("local");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      em,
      password,
    );
    const user = userCredential.user;

    // Send verification immediately so every new account starts with the same
    // security step as the mobile app.
    await sendEmailVerification(user);

    // force token (good practice)
    await user.getIdToken(true);

    return { uid: user.uid, email: user.email || em };
  },

  async signInStudentWithGoogle(): Promise<{
    uid: string;
    email: string;
    emailVerified: boolean;
  }> {
    await setAuthPersistenceMode("local");
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      if (!user) {
        throw new Error("Google sign-in did not return a user.");
      }

      await user.getIdToken(true);
      await waitForAuthUid(auth, user.uid, 15000);

      return {
        uid: user.uid,
        email: String(user.email || "").trim(),
        emailVerified: !!user.emailVerified,
      };
    } catch (err: any) {
      const code = String(err?.code || "").toLowerCase();
      if (code.includes("account-exists-with-different-credential")) {
        const email = String(err?.customData?.email || "").trim();
        const credential = GoogleAuthProvider.credentialFromError(err);

        if (email && credential) {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          pendingGoogleLink = { email, credential, signInMethods };
          throw new PendingGoogleLinkError(email, signInMethods);
        }
      }

      throw err;
    }
  },

  async linkPendingGoogleProviderIfNeeded(user = auth.currentUser): Promise<void> {
    const pending = pendingGoogleLink;
    if (!pending || !user?.email) return;

    if (String(user.email).trim().toLowerCase() !== pending.email.toLowerCase()) {
      return;
    }

    try {
      await linkWithCredential(user, pending.credential);
    } catch (err: any) {
      const code = String(err?.code || "").toLowerCase();
      if (
        !code.includes("provider-already-linked") &&
        !code.includes("credential-already-in-use") &&
        !code.includes("invalid-credential")
      ) {
        throw err;
      }
    } finally {
      pendingGoogleLink = null;
    }
  },

  // =========================
  // COMPLETE PROFILE (Step 2)
  // Creates /users/{uid} AFTER LOGIN
  // =========================
  async completeStudentProfileAfterLogin(
    uid: string,
    input: {
      fullName: string;
      phone: string;
      ageRange: string;
      gender: string;
      weeksToCommit: number;
      totalPrice: number;
      path: string;
      pathId?: string;
      courseId?: string;
      courseDurationWeeks?: number;
      weeklyRate?: number;
    },
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      throw new Error("You must be signed in to complete registration.");
    }

    const fullName = String(input.fullName || "").trim();
    if (fullName.length < 2) throw new Error("Full name is required.");

    const phone = String(input.phone || "").trim();
    if (phone.length < 6) throw new Error("Phone number is required.");

    const pathTitle = String(input.path || "").trim();
    if (!pathTitle) throw new Error("Path is required.");

    // Resolve path title + cohort (pathId preferred)
    let pathIdRaw = String(input.pathId || "").trim();
    let resolvedPathTitle = pathTitle;

    if (pathIdRaw) {
      resolvedPathTitle = await this.resolvePathTitle(pathIdRaw, pathTitle);
    } else {
      const resolvedId = await this.resolvePathId(pathTitle);
      if (resolvedId) pathIdRaw = resolvedId;
    }

    const finalPathId = pathIdRaw || undefined;
    const courseDurationWeeks = Math.floor(
      Number(input.courseDurationWeeks || 0),
    );
    const weeklyRate = Math.floor(Number(input.weeklyRate || 0));

    const activeCohort = finalPathId
      ? await this.getActiveCohortForPathId(finalPathId)
      : await this.getActiveCohortForPath(resolvedPathTitle);

    const weeks = Math.max(1, Math.floor(Number(input.weeksToCommit || 1)));
    const totalPrice = Number(input.totalPrice || 0);

    const profile = stripUndefined({
      uid,
      role: "student",
      status: "Pending", // still pending until payment verified
      timestamp: Date.now(),

      fullName,
      email: String(user.email || "").trim() || "",
      phone,
      ageRange: String(input.ageRange || "").trim(),
      gender: String(input.gender || "").trim(),

      weeksToCommit: weeks,
      totalPrice,

      path: resolvedPathTitle,
      ...(finalPathId ? { pathId: finalPathId } : {}),
      ...(input.courseId ? { courseId: String(input.courseId).trim() } : {}),
      ...(courseDurationWeeks > 0 ? { courseDurationWeeks } : {}),
      ...(weeklyRate > 0 ? { weeklyRate } : {}),

      ...(activeCohort?.cohortId ? { cohortId: activeCohort.cohortId } : {}),
      ...(activeCohort?.label ? { cohortLabel: activeCohort.label } : {}),
      ...(activeCohort?.cohortKey ? { cohortKey: activeCohort.cohortKey } : {}),

      updatedAt: Date.now(),
    });

    // ✅ Create the doc once (after login, auth exists)
    await setDoc(doc(db, "users", uid), profile, { merge: false });
  },

  async createAccount(
    entry: NewStudentEntry,
    password: string,
  ): Promise<string> {
    const email = String((entry as any).email || "").trim();
    if (!email) throw new Error("Email is required.");

    // 1) Create user (this signs in immediately, but state may lag)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // 2) Force token + WAIT for auth.currentUser to reflect new uid
    await user.getIdToken(true);
    await waitForAuthUid(auth, user.uid, 15000);

    // 3) Resolve path + cohort
    let pathIdRaw = String((entry as any).pathId || "").trim();
    const pathTitleRaw = String((entry as any).path || "").trim();

    let resolvedPathTitle = pathTitleRaw;

    if (pathIdRaw) {
      resolvedPathTitle = await this.resolvePathTitle(pathIdRaw, pathTitleRaw);
    } else {
      const resolvedId = await this.resolvePathId(resolvedPathTitle);
      if (resolvedId) pathIdRaw = resolvedId;
    }

    if (!resolvedPathTitle) throw new Error("Path resolution failed.");

    const finalPathId = pathIdRaw;
    const courseDurationWeeks = Math.floor(
      Number((entry as any).courseDurationWeeks || 0),
    );
    const weeklyRate = Math.floor(Number((entry as any).weeklyRate || 0));
    const activeCohort = finalPathId
      ? await this.getActiveCohortForPathId(finalPathId)
      : await this.getActiveCohortForPath(resolvedPathTitle);

    const resolvedPath =
      resolvedPathTitle || String(activeCohort?.path || "").trim();
    if (!resolvedPath) throw new Error("Path is required.");

    const profile = stripUndefined({
      uid: user.uid,
      role: "student",
      status: "Pending",
      timestamp: Date.now(),

      fullName: String((entry as any).fullName || "Student").trim(),
      email: user.email || email,
      phone: String((entry as any).phone || "").trim(),

      ageRange: String((entry as any).ageRange || "18+").trim(),
      gender: String((entry as any).gender || "Other").trim(),

      weeksToCommit: Math.max(
        1,
        Math.floor(Number((entry as any).weeksToCommit || 1)),
      ),
      totalPrice: Number((entry as any).totalPrice || 0),

      path: resolvedPath,
      ...(finalPathId ? { pathId: finalPathId } : {}),
      ...((entry as any).courseId
        ? { courseId: String((entry as any).courseId).trim() }
        : {}),
      ...(courseDurationWeeks > 0 ? { courseDurationWeeks } : {}),
      ...(weeklyRate > 0 ? { weeklyRate } : {}),

      ...(activeCohort?.cohortId ? { cohortId: activeCohort.cohortId } : {}),
      ...(activeCohort?.label ? { cohortLabel: activeCohort.label } : {}),
      ...(activeCohort?.cohortKey ? { cohortKey: activeCohort.cohortKey } : {}),

      updatedAt: Date.now(),
    });

    // 4) Write profile (rules require signed-in user matches doc id)
    await setDoc(doc(db, "users", user.uid), profile, { merge: false });

    return user.uid;
  },

  async login(
    email: string,
    password: string,
    options?: { persistence?: "local" | "session" },
  ): Promise<string> {
    await setAuthPersistenceMode(options?.persistence || "local");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  },

  // ✅ Student-safe: only fields your rules allow a student to change
  async updateStudentEnrollmentFields(
    uid: string,
    patch: Partial<
      Pick<RegistrationEntry, "cohortId" | "cohortLabel" | "cohortKey">
    >,
  ): Promise<void> {
    const clean = stripUndefined({
      ...patch,
      updatedAt: Date.now(),
    });

    await updateDoc(doc(db, "users", uid), clean);
  },

  // ✅ Admin-only helper (keep if you need it in admin dashboard)
  async adminUpdateUserEnrollmentMeta(
    uid: string,
    patch: Partial<
      Pick<
        RegistrationEntry,
        | "cohortId"
        | "cohortLabel"
        | "cohortKey"
        | "pathId"
        | "path"
        | "courseId"
      >
    >,
  ): Promise<void> {
    const clean = stripUndefined({
      ...patch,
      updatedAt: Date.now(),
    });

    await updateDoc(doc(db, "users", uid), clean);
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
    const weeks = Math.max(1, Math.floor(Number(pending.weeks || 1)));
    const amount = Math.max(0, Number(pending.amount || 0));
    const reference = String(pending.reference || "").trim();

    await updateDoc(doc(db, "users", uid), {
      pendingPayment: {
        kind: pending.kind,
        status: "Pending",
        weeks,
        amount,
        reference,
        createdAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  },

  async clearPendingPayment(uid: string): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      pendingPayment: deleteField(),
      updatedAt: Date.now(),
    });
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async sendCurrentUserVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No signed-in user found.");
    await sendEmailVerification(user);
  },

  async reloadCurrentUser(): Promise<{
    uid: string;
    email: string;
    emailVerified: boolean;
  } | null> {
    const user = auth.currentUser;
    if (!user) return null;

    await reload(user);

    return {
      uid: user.uid,
      email: String(user.email || "").trim(),
      emailVerified: !!user.emailVerified,
    };
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
    await updateDoc(doc(db, "users", uid), {
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

  // =========================
  // COHORT SESSIONS
  // =========================
  _sessionsCol(cohortDocId: string) {
    // ✅ cohortDocId should be the cohort document ID (usually cohortKey like FLUTTER-2026-03)
    return collection(db, "cohorts", cohortDocId, "sessions");
  },

  _toTimestamp(input: TimestampLike): Timestamp {
    if (!input) throw new Error("startsAt is required");
    if (input instanceof Timestamp) return input;

    if (typeof input === "number") return Timestamp.fromMillis(input);

    if (typeof input === "string") {
      const d = new Date(input);
      if (isNaN(d.getTime())) throw new Error("Invalid date string");
      return Timestamp.fromDate(d);
    }

    if (
      (input as any)?.toMillis &&
      typeof (input as any).toMillis === "function"
    ) {
      return input as any as Timestamp;
    }

    throw new Error("Invalid startsAt format");
  },

  _sanitizeSessionInput(
    input: any,
  ): Omit<SessionDoc, "id" | "createdAt" | "updatedAt"> {
    const week = Number(input.week);
    if (!Number.isFinite(week) || week < 1)
      throw new Error("Week must be >= 1");

    const pathId = input.pathId ? String(input.pathId).trim() : undefined;

    // ✅ Keep legacy path required for now (backward-compatible)
    // If a caller sends pathId but forgets title, avoid crashing hard:
    let path = String(input.path || "").trim();
    if (!path && pathId) path = "Unknown Path";
    if (!path) throw new Error("Session path (title) is required.");

    const title = String(input.title || "").trim();
    if (!title) throw new Error("Session title is required.");

    const startsAt = this._toTimestamp(input.startsAt);

    let endsAt: Timestamp | undefined = undefined;
    if (input.endsAt) endsAt = this._toTimestamp(input.endsAt);

    return stripUndefined({
      week: Math.floor(week),
      path,
      pathId,
      isPublished: !!input.isPublished,
      title,
      startsAt,
      endsAt,
      joinUrl: input.joinUrl ? String(input.joinUrl).trim() : "",
      recordingUrl: input.recordingUrl
        ? String(input.recordingUrl).trim()
        : "",
      durationMins:
        input.durationMins !== undefined
          ? Math.max(15, Math.floor(Number(input.durationMins)))
          : 60,
      notes: input.notes ? String(input.notes).trim() : "",
    });
  },

  async getCohortSessions(cohortDocId: string): Promise<SessionDoc[]> {
    try {
      const snap = await getDocs(
        query(
          this._sessionsCol(cohortDocId),
          orderBy("week", "asc"),
          orderBy("startsAt", "asc"),
        ),
      );

      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as SessionDoc[];
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();
      const code = String(e?.code || "").toLowerCase();

      // ✅ common: missing composite index for (week asc, startsAt asc)
      const looksLikeIndex =
        code.includes("failed-precondition") || msg.includes("index");

      if (looksLikeIndex) {
        // ✅ safe fallback so admin still sees sessions
        const snap2 = await getDocs(
          query(this._sessionsCol(cohortDocId), orderBy("week", "asc")),
        );

        return snap2.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as SessionDoc[];
      }

      throw e;
    }
  },

  async addCohortSession(
    cohortDocId: string,
    input: SessionInput,
  ): Promise<string> {
    const clean = this._sanitizeSessionInput(input);

    // ✅ deterministic id prevents duplicates on double-click / retry
    const ms = (clean.startsAt as any)?.toMillis
      ? (clean.startsAt as any).toMillis()
      : Date.now();

    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");

    const safeWeek = String(clean.week || 1).padStart(2, "0");
    const safePathId = String((clean as any).pathId || "nopid")
      .trim()
      .replace(/[^\w-]/g, "_");

    const sessionId = `W${safeWeek}_${yyyy}${mm}${dd}_${hh}${mi}_${safePathId}`;

    const payload = stripUndefined({
      ...clean,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await setDoc(
      doc(db, "cohorts", cohortDocId, "sessions", sessionId),
      payload,
      { merge: false },
    );

    return sessionId;
  },

  async upsertCohortSession(
    cohortDocId: string,
    sessionId: string,
    input: SessionInput,
  ): Promise<string> {
    const clean = this._sanitizeSessionInput(input);
    const payload = stripUndefined({
      ...clean,
      id: sessionId,
      updatedAt: Date.now(),
      createdAt: Date.now(), // if already exists, merge keeps old if you want; we’ll merge
    });

    await setDoc(
      doc(db, "cohorts", cohortDocId, "sessions", sessionId),
      payload,
      { merge: true },
    );

    return sessionId;
  },

  async updateCohortSession(
    cohortDocId: string,
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
    if ((patch as any).pathId !== undefined) {
      const v = String((patch as any).pathId || "").trim();
      clean.pathId = v ? v : deleteField(); // allow clearing
    }

    if (patch.title !== undefined)
      clean.title = String(patch.title || "").trim();
    if (patch.joinUrl !== undefined)
      clean.joinUrl = String(patch.joinUrl || "").trim();
    if ((patch as any).recordingUrl !== undefined)
      clean.recordingUrl = String((patch as any).recordingUrl || "").trim();
    if (patch.isPublished !== undefined)
      clean.isPublished = !!patch.isPublished;

    if (patch.durationMins !== undefined)
      clean.durationMins = Math.max(15, Math.floor(Number(patch.durationMins)));
    if (patch.notes !== undefined)
      clean.notes = String(patch.notes || "").trim();

    if (patch.startsAt !== undefined)
      clean.startsAt = this._toTimestamp(patch.startsAt);

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

    await updateDoc(
      doc(db, "cohorts", cohortDocId, "sessions", sessionId),
      stripUndefined(clean),
    );
  },

  async deleteCohortSession(
    cohortDocId: string,
    sessionId: string,
  ): Promise<void> {
    await deleteDoc(doc(db, "cohorts", cohortDocId, "sessions", sessionId));
  },

  async sendCohortMessage(input: {
    cohortId: string;
    cohortLabel: string;
    title: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    sentBy?: string;
  }): Promise<string> {
    const cohortId = String(input.cohortId || "").trim();
    const cohortLabel = String(input.cohortLabel || "").trim();
    const title = String(input.title || "").trim();
    const body = String(input.body || "").trim();

    if (!cohortId) throw new Error("Cohort is required.");
    if (title.length < 3) throw new Error("Message title is too short.");
    if (body.length < 5) throw new Error("Message body is too short.");

    const payload = stripUndefined({
      cohortId,
      cohortLabel: cohortLabel || cohortId,
      title,
      body,
      ctaLabel: String(input.ctaLabel || "").trim(),
      ctaUrl: String(input.ctaUrl || "").trim(),
      sentBy: String(input.sentBy || "").trim(),
      sentAt: serverTimestamp(),
      createdAt: Date.now(),
      status: "sent" as const,
    });

    const ref = await addDoc(collection(db, "cohorts", cohortId, "messages"), payload);
    return ref.id;
  },

  async getCohortMessages(cohortId: string, max = 20): Promise<CohortMessageDoc[]> {
    const cleanId = String(cohortId || "").trim();
    if (!cleanId) return [];

    const safeLimit = Math.max(1, Math.min(50, Math.floor(Number(max) || 20)));
    const snap = await getDocs(
      query(
        collection(db, "cohorts", cleanId, "messages"),
        orderBy("createdAt", "desc"),
        limit(safeLimit),
      ),
    );

    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CohortMessageDoc[];
  },

  async updateCohortMessage(
    cohortId: string,
    messageId: string,
    updates: {
      title?: string;
      body?: string;
      ctaLabel?: string;
      ctaUrl?: string;
    }
  ): Promise<void> {
    const cleanCohortId = String(cohortId || "").trim();
    const cleanMessageId = String(messageId || "").trim();

    if (!cleanCohortId) throw new Error("Cohort is required.");
    if (!cleanMessageId) throw new Error("Message ID is required.");

    const updatePayload = stripUndefined({
      title: updates.title ? String(updates.title).trim() : undefined,
      body: updates.body ? String(updates.body).trim() : undefined,
      ctaLabel: updates.ctaLabel ? String(updates.ctaLabel).trim() : undefined,
      ctaUrl: updates.ctaUrl ? String(updates.ctaUrl).trim() : undefined,
      updatedAt: serverTimestamp(),
    });

    if (Object.keys(updatePayload).length === 0) {
      throw new Error("No valid fields to update.");
    }

    await updateDoc(
      doc(db, "cohorts", cleanCohortId, "messages", cleanMessageId),
      updatePayload
    );
  },

  async deleteCohortMessage(cohortId: string, messageId: string): Promise<void> {
    const cleanCohortId = String(cohortId || "").trim();
    const cleanMessageId = String(messageId || "").trim();

    if (!cleanCohortId) throw new Error("Cohort is required.");
    if (!cleanMessageId) throw new Error("Message ID is required.");

    await deleteDoc(
      doc(db, "cohorts", cleanCohortId, "messages", cleanMessageId)
    );
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

  _sanitizeSyllabus(syllabus: any, weeks?: number): SyllabusWeek[] {
    const list: any[] = Array.isArray(syllabus) ? syllabus : [];

    const clean = list
      .filter(Boolean)
      .map((w: any, idx: number) => ({
        week: idx + 1,
        title: String(w?.title || "").trim(),
        topics: Array.isArray(w?.topics)
          ? w.topics.map((t: any) => String(t).trim()).filter(Boolean)
          : [],
      }))
      .filter((w) => w.title.length > 0 || w.topics.length > 0);

    const limit =
      weeks && Number.isFinite(weeks)
        ? Math.max(1, Math.floor(weeks))
        : clean.length;

    return clean.slice(0, limit);
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

    const showInExplore = input.showInExplore ?? true;
    const showOnLanding = input.showOnLanding ?? input.isActive ?? true;

    const cleanPayload: any = stripUndefined({
      pathId: (input as any).pathId
        ? String((input as any).pathId).trim()
        : undefined,

      title: String(input.title || "").trim(),
      duration: String(input.duration || "").trim(),
      sessions: String(input.sessions || "").trim(),
      level: String(input.level || "").trim(),
      description: String(input.description || "").trim(),
      priceLabel: String(input.priceLabel || ""),
      imageUrl: String(input.imageUrl || ""),
      syllabusView: String(input.syllabusView || ""),

      isActive: input.isActive ?? true,
      showOnLanding,
      showInExplore,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (weeks !== undefined) cleanPayload.weeks = weeks;
    if (pricePerWeek !== undefined) cleanPayload.pricePerWeek = pricePerWeek;
    if (syllabus.length > 0) cleanPayload.syllabus = syllabus;

    const ref = await addDoc(coursesColRef, cleanPayload);
    return ref.id;
  },

  async updateCourse(courseId: string, patch: CoursePatch): Promise<void> {
    const cleanPatch: any = { updatedAt: Date.now() };

    if ((patch as any).pathId !== undefined) {
      const v = String((patch as any).pathId || "").trim();
      cleanPatch.pathId = v ? v : deleteField(); // allow clearing
    }

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
    if ((patch as any).showOnLanding !== undefined)
      cleanPatch.showOnLanding = !!(patch as any).showOnLanding;
    if ((patch as any).showInExplore !== undefined)
      cleanPatch.showInExplore = !!(patch as any).showInExplore;

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

    await updateDoc(doc(db, "courses", courseId), stripUndefined(cleanPatch));
  },

  async deleteCourse(courseId: string): Promise<void> {
    await deleteDoc(doc(db, "courses", courseId));
  },

  // =========================
  // RESOURCES (Admin-managed)
  // =========================
  async getResources(): Promise<ResourceDoc[]> {
    const snap = await getDocs(
      query(resourcesColRef, orderBy("updatedAt", "desc")),
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as ResourceDoc[];
  },

  async getPublishedResources(): Promise<ResourceDoc[]> {
    const snap = await getDocs(
      query(resourcesColRef, where("isPublished", "==", true)),
    );
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
      .sort((a: any, b: any) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)) as ResourceDoc[];
  },

  async addResource(input: ResourceInput): Promise<string> {
    const payload = stripUndefined({
      name: String(input.name || "").trim(),
      type: String(input.type || "PDF").trim() || "PDF",
      size: String(input.size || "").trim(),
      folder: String(input.folder || "General").trim() || "General",
      url: String(input.url || "").trim(),
      description: input.description
        ? String(input.description).trim()
        : undefined,
      pathId: input.pathId ? String(input.pathId).trim() : undefined,
      courseId: input.courseId ? String(input.courseId).trim() : undefined,
      sessionId: input.sessionId ? String(input.sessionId).trim() : undefined,
      sessionWeek:
        input.sessionWeek !== undefined && input.sessionWeek !== null
          ? (() => {
              const week = Number(input.sessionWeek);
              return Number.isFinite(week) && week >= 1 && week <= 52
                ? Math.trunc(week)
                : undefined;
            })()
          : undefined,
      isPublished: input.isPublished !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (!payload.name) throw new Error("Resource name is required.");
    if (!payload.url) throw new Error("Resource URL is required.");

    const ref = await addDoc(resourcesColRef, payload);
    return ref.id;
  },

  async updateResource(resourceId: string, patch: ResourcePatch): Promise<void> {
    const cleanPatch: any = { updatedAt: Date.now() };

    if (patch.name !== undefined) cleanPatch.name = String(patch.name).trim();
    if (patch.type !== undefined) cleanPatch.type = String(patch.type).trim();
    if (patch.size !== undefined) cleanPatch.size = String(patch.size).trim();
    if (patch.folder !== undefined)
      cleanPatch.folder = String(patch.folder).trim() || "General";
    if (patch.url !== undefined) cleanPatch.url = String(patch.url).trim();
    if (patch.description !== undefined)
      cleanPatch.description = patch.description
        ? String(patch.description).trim()
        : deleteField();
    if (patch.pathId !== undefined) {
      const value = String(patch.pathId || "").trim();
      cleanPatch.pathId = value ? value : deleteField();
    }
    if (patch.courseId !== undefined) {
      const value = String(patch.courseId || "").trim();
      cleanPatch.courseId = value ? value : deleteField();
    }
    if (patch.sessionId !== undefined) {
      const value = String(patch.sessionId || "").trim();
      cleanPatch.sessionId = value ? value : deleteField();
    }
    if (patch.sessionWeek !== undefined) {
      const numericWeek = Number(patch.sessionWeek);
      cleanPatch.sessionWeek =
        Number.isFinite(numericWeek) && numericWeek >= 1 && numericWeek <= 52
          ? Math.trunc(numericWeek)
          : deleteField();
    }
    if (patch.isPublished !== undefined)
      cleanPatch.isPublished = !!patch.isPublished;

    await updateDoc(doc(db, "resources", resourceId), stripUndefined(cleanPatch));
  },

  async deleteResource(resourceId: string): Promise<void> {
    await deleteDoc(doc(db, "resources", resourceId));
  },

  // =========================
  // COMMUNITY SPACES (Admin-managed)
  // =========================
  async getCommunitySpaces(): Promise<CommunitySpaceDoc[]> {
    const snap = await getDocs(query(communitySpacesColRef, orderBy("sortOrder", "asc")));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
      .sort((a: any, b: any) => {
        const sortOrder = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
        if (sortOrder !== 0) return sortOrder;
        return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
      }) as CommunitySpaceDoc[];
  },

  async getPublishedCommunitySpaces(): Promise<CommunitySpaceDoc[]> {
    const snap = await getDocs(
      query(communitySpacesColRef, where("isPublished", "==", true)),
    );
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
      .sort((a: any, b: any) => {
        const sortOrder = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
        if (sortOrder !== 0) return sortOrder;
        return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
      }) as CommunitySpaceDoc[];
  },

  async addCommunitySpace(input: CommunitySpaceInput): Promise<string> {
    const payload = stripUndefined({
      title: String(input.title || "").trim(),
      description: String(input.description || "").trim(),
      cohortId: input.cohortId ? String(input.cohortId).trim() : undefined,
      cohortLabel: input.cohortLabel
        ? String(input.cohortLabel).trim()
        : undefined,
      pathId: input.pathId ? String(input.pathId).trim() : undefined,
      roomUrl: input.roomUrl ? String(input.roomUrl).trim() : undefined,
      ctaLabel: input.ctaLabel ? String(input.ctaLabel).trim() : undefined,
      category: input.category ? String(input.category).trim() : "General",
      icon: input.icon ? String(input.icon).trim() : "forum",
      isPublished: input.isPublished !== false,
      sortOrder: Number.isFinite(Number(input.sortOrder))
        ? Math.max(0, Math.trunc(Number(input.sortOrder)))
        : 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (!payload.title || payload.title.length < 2) {
      throw new Error("Space title must be at least 2 characters.");
    }
    if (!payload.description || payload.description.length < 8) {
      throw new Error("Space description must be at least 8 characters.");
    }

    const ref = await addDoc(communitySpacesColRef, payload);
    return ref.id;
  },

  async updateCommunitySpace(
    spaceId: string,
    patch: CommunitySpacePatch,
  ): Promise<void> {
    const cleanPatch: any = { updatedAt: Date.now() };

    if (patch.title !== undefined) cleanPatch.title = String(patch.title).trim();
    if (patch.description !== undefined)
      cleanPatch.description = String(patch.description).trim();
    if (patch.cohortId !== undefined) {
      const value = String(patch.cohortId || "").trim();
      cleanPatch.cohortId = value ? value : deleteField();
    }
    if (patch.cohortLabel !== undefined) {
      const value = String(patch.cohortLabel || "").trim();
      cleanPatch.cohortLabel = value ? value : deleteField();
    }
    if (patch.pathId !== undefined) {
      const value = String(patch.pathId || "").trim();
      cleanPatch.pathId = value ? value : deleteField();
    }
    if (patch.roomUrl !== undefined) {
      const value = String(patch.roomUrl || "").trim();
      cleanPatch.roomUrl = value ? value : deleteField();
    }
    if (patch.ctaLabel !== undefined) {
      const value = String(patch.ctaLabel || "").trim();
      cleanPatch.ctaLabel = value ? value : deleteField();
    }
    if (patch.category !== undefined) {
      const value = String(patch.category || "").trim();
      cleanPatch.category = value ? value : deleteField();
    }
    if (patch.icon !== undefined) {
      const value = String(patch.icon || "").trim();
      cleanPatch.icon = value ? value : deleteField();
    }
    if (patch.isPublished !== undefined)
      cleanPatch.isPublished = !!patch.isPublished;
    if (patch.sortOrder !== undefined) {
      const numericValue = Number(patch.sortOrder);
      cleanPatch.sortOrder = Number.isFinite(numericValue)
        ? Math.max(0, Math.trunc(numericValue))
        : 0;
    }

    await updateDoc(
      doc(db, "communitySpaces", spaceId),
      stripUndefined(cleanPatch),
    );
  },

  async deleteCommunitySpace(spaceId: string): Promise<void> {
    await deleteDoc(doc(db, "communitySpaces", spaceId));
  },

  // ✅ Student unlock helper (upgraded: prefer pathId, fallback to path string)
  async getUnlockedSessionsForStudent(
    profile: RegistrationEntry,
  ): Promise<SessionDoc[]> {
    // 🔒 Gate access: if payment is pending or not enrolled, no sessions
    const hasAnyPending =
      profile?.status === "Pending" ||
      profile?.pendingPayment?.status === "Pending";

    if (hasAnyPending) return [];

    let cohortDocId = profile.cohortKey || profile.cohortId;

    if (!cohortDocId) {
      if (profile.pathId) {
        const active = await this.getActiveCohortForPathId(profile.pathId);
        cohortDocId = active.cohortKey || active.cohortId;
      } else {
        const active = await this.getActiveCohortForPath(profile.path);
        cohortDocId = active.cohortKey || active.cohortId;
      }
    }

    const paidWeeks = Math.max(0, Number(profile.weeksToCommit || 0));
    if (!cohortDocId || paidWeeks <= 0) return [];

    // ✅ NOTE:
    // Avoid composite index requirement by NOT doing orderBy("startsAt") in Firestore.
    // We'll sort client-side.
    try {
      if (profile.pathId) {
        const snap = await getDocs(
          query(
            this._sessionsCol(cohortDocId),
            where("pathId", "==", profile.pathId),
            where("isPublished", "==", true),
            where("week", "<=", paidWeeks),
            orderBy("week", "asc"),
          ),
        );

        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as SessionDoc[];

        if (items.length > 0) {
          return items.sort((a: any, b: any) => {
            const am =
              typeof a?.startsAt?.toMillis === "function"
                ? a.startsAt.toMillis()
                : 0;
            const bm =
              typeof b?.startsAt?.toMillis === "function"
                ? b.startsAt.toMillis()
                : 0;
            return am - bm;
          });
        }
      }

      // Legacy fallback (path string)
      const snap = await getDocs(
        query(
          this._sessionsCol(cohortDocId),
          where("path", "==", profile.path),
          where("isPublished", "==", true),
          where("week", "<=", paidWeeks),
          orderBy("week", "asc"),
        ),
      );

      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as SessionDoc[];

      return items.sort((a: any, b: any) => {
        const am =
          typeof a?.startsAt?.toMillis === "function"
            ? a.startsAt.toMillis()
            : 0;
        const bm =
          typeof b?.startsAt?.toMillis === "function"
            ? b.startsAt.toMillis()
            : 0;
        return am - bm;
      });
    } catch (e) {
      // ✅ IMPORTANT: log it so you actually see index errors
      console.error("getUnlockedSessionsForStudent failed:", e);
      return [];
    }
  },

  // =========================
  // ADMIN: CLEAR ALL USERS
  // =========================
  async clearAll(): Promise<void> {
    const snap = await getDocs(collection(db, "users"));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
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
    await updateDoc(doc(db, "cohorts", cohortId), stripUndefined(cleanPatch));
  },

  async deleteCohort(cohortId: string): Promise<void> {
    await deleteDoc(doc(db, "cohorts", cohortId));
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
};
