import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  deleteDoc
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

export const registrationStore = {
  async createAccount(entry: any, password: string): Promise<string> {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      entry.email,
      password
    );

    const user = userCredential.user;

    // 2. Save user profile in Firestore
    const profile: RegistrationEntry = {
      ...entry,
      uid: user.uid,
      role: "student",
      status: "Pending",
      timestamp: Date.now()
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return user.uid;
  },

  async updateStatus(uid: string, status: "Pending" | "Complete") {
    await updateDoc(doc(db, "users", uid), { status });
  },

  async getAll(): Promise<RegistrationEntry[]> {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as RegistrationEntry);
  },

  async delete(uid: string) {
    await deleteDoc(doc(db, "users", uid));
  },

  async clearAll() {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
  }
};