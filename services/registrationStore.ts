
import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
  status: 'Pending' | 'Complete';
  role: 'student' | 'admin';
  timestamp: number;
}

export const registrationStore = {
  // NEW: Integrated Auth + Firestore Creation
  async createAccount(entry: any, password: string): Promise<string> {
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, entry.email, password);
    const user = userCredential.user;

    // 2. Save Profile in Firestore using the UID
    const profile: RegistrationEntry = {
      ...entry,
      uid: user.uid,
      role: 'student',
      status: 'Pending',
      timestamp: Date.now()
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return user.uid;
  },

  async updateStatus(uid: string, status: 'Pending' | 'Complete'): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { status });
  },

  async getAll(): Promise<RegistrationEntry[]> {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as RegistrationEntry);
  },

  async delete(uid: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid));
    // Note: This doesn't delete the Auth user, usually done via Admin SDK/Cloud Functions
  },

  // Fix: Added clearAll method to handle batch deletion in AdminDashboard
  async clearAll(): Promise<void> {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  }
};
