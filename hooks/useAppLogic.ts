import { useEffect, useState } from "react";
import { View } from "../src/App";
import {
  RegistrationEntry,
  registrationStore,
} from "../services/registrationStore";
import { auth, db } from "../services/firebase";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

const HANDOFF_KEY = "cwg_registration_handoff";

const safeJsonParse = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

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

export const useAppLogic = () => {
  // 🧭 APP STATE
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedPath, setSelectedPath] = useState("");
  const [activeRegistration, setActiveRegistration] =
    useState<RegistrationEntry | null>(null);

  // 🌗 THEME
  const [isDark, setIsDark] = useState(false);

  // 🔐 AUTH STATE
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] =
    useState<RegistrationEntry | null>(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // ✅ Auth bootstrap (admin vs student)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setStudentUser(null);
        setStudentProfile(null);
        setIsLoadingAuth(false);
        return;
      }

      try {
        // 1) admin check
        const adminSnap = await getDoc(doc(db, "admins", user.uid));

        if (adminSnap.exists()) {
          setAdminUser(user);
          setStudentUser(null);
          setStudentProfile(null);
          setIsLoadingAuth(false);
          return;
        }

        // 2) student path (IMPORTANT CHANGE)
        // If /users/{uid} does NOT exist yet, this is a "Step 2" student.
        // Do NOT sign out — allow ContinueRegistration to create the profile doc.
        const userSnap = await getDoc(doc(db, "users", user.uid));

        setAdminUser(null);
        setStudentUser(user);

        if (userSnap.exists()) {
          setStudentProfile(userSnap.data() as RegistrationEntry);
        } else {
          setStudentProfile(null); // ✅ allow continue-registration flow
        }
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        setAdminUser(null);
        setStudentUser(user || null);
        setStudentProfile(null);
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return unsub;
  }, []);

  // 🌗 THEME INIT
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const dark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // ✅ Helper: load registration handoff into state
  const hydrateRegistrationFromHandoff = () => {
    const raw = localStorage.getItem(HANDOFF_KEY);
    const data = safeJsonParse(raw);
    const handoff = data?.handoff ?? data;

    if (handoff?.uid) {
      setActiveRegistration(handoff);
      if (handoff?.path) setSelectedPath(handoff.path);
      return handoff;
    }

    return null;
  };

  // 🧭 NAVIGATION
  const navigateTo = (view: View, extraData?: any) => {
    if (view === "payment") {
      if (extraData) {
        if (extraData?.userData?.uid) {
          setActiveRegistration(extraData.userData);
          if (extraData.selectedPath) setSelectedPath(extraData.selectedPath);
        } else if (extraData?.uid) {
          setActiveRegistration(extraData);
          if (extraData.path) setSelectedPath(extraData.path);
        }
      } else {
        try {
          const raw = localStorage.getItem(HANDOFF_KEY);
          if (raw) {
            const handoff = JSON.parse(raw);
            if (handoff?.uid) {
              setActiveRegistration(handoff);
              if (handoff?.path) setSelectedPath(handoff.path);
            }
          }
        } catch {}
      }
    }

    if (typeof extraData === "string") {
      setSelectedPath(extraData);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📝 REGISTRATION
  const handleRegistrationSubmit = (data: any) => {
    const handoff = data?.handoff ?? data;
    if (handoff?.uid) setActiveRegistration(handoff);
    if (handoff?.path) setSelectedPath(handoff.path);
    navigateTo("student-login");
  };

  // ✅ Called after payment success
  const completePayment = async () => {
    if (!activeRegistration) return;

    // Refresh latest profile from Firestore after backend verification
    if (studentUser?.uid === activeRegistration.uid) {
      const userDoc = await getDoc(doc(db, "users", activeRegistration.uid));
      if (userDoc.exists()) {
        setStudentProfile(userDoc.data() as RegistrationEntry);
      }
    }

    localStorage.removeItem(HANDOFF_KEY);
  };

  // 🔐 ADMIN LOGIN
  const loginAdmin = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const adminSnap = await getDoc(doc(db, "admins", cred.user.uid));
      if (!adminSnap.exists()) {
        await signOut(auth);
        throw new Error("Access denied: Admins only");
      }

      navigateTo("admin-dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logoutAdmin = async () => {
    await signOut(auth);
    navigateTo("home");
  };

  // 🎓 STUDENT LOGIN
  const loginStudent = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      await waitForAuthUid(auth, cred.user.uid, 15000);

      // ✅ If profile exists -> dashboard
      // ✅ If missing -> continue registration
      const profile = await registrationStore.getUserProfile(cred.user.uid);

      if (!profile) {
        navigateTo("continue-registration");
      } else {
        navigateTo("student-dashboard");
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login failed" };
    }
  };

  const logoutStudent = async () => {
    await signOut(auth);
    navigateTo("home");
  };

  return {
    currentView,
    selectedPath,
    activeRegistration,

    isDark,
    toggleTheme,

    isAdminLoggedIn: !!adminUser,
    isStudentLoggedIn: !!studentUser,
    isLoadingAuth,
    studentProfile,

    navigateTo,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin,
    loginStudent,
    logoutStudent,
  };
};
