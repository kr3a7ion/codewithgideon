import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  deleteDoc,
  increment,
  addDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

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
}

// 🔑 Single source of truth
const usersColRef = collection(db, "users");

// ✅ Safer input type (prevents weird extra fields)
type NewStudentEntry = Omit<
  RegistrationEntry,
  "uid" | "role" | "status" | "timestamp"
>;

export const registrationStore = {
  // 1️⃣ Create account + registration record
  async createAccount(entry: NewStudentEntry, password: string): Promise<string> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      entry.email,
      password
    );

    const user = userCredential.user;

    const profile: RegistrationEntry = {
      ...entry,
      uid: user.uid,
      role: "student",
      status: "Pending",
      timestamp: Date.now(),
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return user.uid;
  },

  // 2️⃣ Get all registrations (admin dashboard)
  // ✅ Fix: guarantee uid exists (fallback to doc id)
  async getAll(): Promise<RegistrationEntry[]> {
    const snap = await getDocs(query(usersColRef));
    return snap.docs.map((d) => {
      const data = d.data() as RegistrationEntry;
      return { ...data, uid: data.uid || d.id };
    });
  },

  // 3️⃣ Update registration status
  async updateStatus(uid: string, status: "Pending" | "Complete"): Promise<void> {
    await updateDoc(doc(db, "users", uid), { status });
  },

  // 4️⃣ Record payment / top-up
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
    });

    await addDoc(collection(db, "users", uid, "payments"), {
      amount,
      weeks: additionalWeeks,
      reference,
      timestamp: Date.now(),
    });
  },

  // 5️⃣ Delete one registration
  async delete(uid: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid));
  },

  // 6️⃣ Clear all registrations (danger zone 🔥)
  async clearAll(): Promise<void> {
    const snap = await getDocs(usersColRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },
};