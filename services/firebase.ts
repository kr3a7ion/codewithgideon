import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBu_kePsFp5JeEDepRvXr4Bmk8looDLZNQ",
  authDomain: "codewithgideon.firebaseapp.com",
  projectId: "codewithgideon",
  storageBucket: "codewithgideon.firebasestorage.app",
  messagingSenderId: "922933676739",
  appId: "1:922933676739:web:220fc5899769bddb1a7076",
  measurementId: "G-0GE1KM119Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

await setPersistence(auth, browserLocalPersistence);
await auth.authStateReady();
