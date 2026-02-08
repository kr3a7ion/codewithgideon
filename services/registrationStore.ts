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

type ActiveCohort = { id: string; label: string };
const usersColRef = collection(db, "users");

type NewStudentEntry = Omit<
  RegistrationEntry,
  "uid" | "role" | "status" | "timestamp"
>;

export const registrationStore = {
  async getActiveCohort(): Promise<ActiveCohort> {
    const ref = doc(db, "config", "app");
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() as any) : null;

    return {
      id: data?.activeCohortId || "CWG-DEFAULT",
      label: data?.activeCohortLabel || "Current Cohort",
    };
  },

  // ✅ Register (Auth) + profile (Firestore)
  async createAccount(entry: NewStudentEntry, password: string): Promise<string> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      entry.email,
      password
    );

    const user = userCredential.user;

    const profile: RegistrationEntry = {
      ...(entry as any),
      uid: user.uid,
      role: "student",
      status: "Pending",
      timestamp: Date.now(),
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return user.uid;
  },

  // ✅ Student login (Auth)
  async login(email: string, password: string): Promise<string> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  },


  // ✅ Save pending payment (initial or topup)
async setPendingPayment(
  uid: string,
  pending: {
    kind: "initial" | "topup";
    weeks: number;
    amount: number;
    reference: string;
  }
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

// ✅ Clear pending payment when user cancels OR after success
async clearPendingPayment(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { pendingPayment: deleteField() });
},


  // ✅ Forgot password
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // ✅ Logout
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

  async updateStatus(uid: string, status: "Pending" | "Complete"): Promise<void> {
    await updateDoc(doc(db, "users", uid), { status });
  },

  async recordTopUp(
  uid: string,
  additionalWeeks: number,
  amount: number,
  reference: string
): Promise<void> {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    weeksToCommit: increment(additionalWeeks),
    status: "Complete",
    pendingPayment: deleteField(), // ✅ clear pending on success
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
};