import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

// Initialise once, before any module touches Firestore or Auth.
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const adminAuth = getAuth();
