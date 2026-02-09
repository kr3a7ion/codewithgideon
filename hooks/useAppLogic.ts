import { useEffect, useState } from "react";
import { View } from "../App";
import { RegistrationEntry, registrationStore } from "../services/registrationStore";
import { auth, db } from "../services/firebase";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

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
        const adminSnap = await getDoc(doc(db, "admins", user.uid));

        if (adminSnap.exists()) {
          setAdminUser(user);
          setStudentUser(null);
          setStudentProfile(null);
        } else {
          const userSnap = await getDoc(doc(db, "users", user.uid));

          if (!userSnap.exists()) {
            await signOut(auth);
            setIsLoadingAuth(false);
            return;
          }

          setStudentUser(user);
          setStudentProfile(userSnap.data() as RegistrationEntry);
          setAdminUser(null);
        }
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        await signOut(auth);
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return unsub;
  }, []);

  // 🌗 THEME INIT
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  // 🧭 NAVIGATION (supports extraData payload)
  const navigateTo = (view: View, extraData?: any) => {
    // Payment payload from StudentDashboard: { selectedPath, userData }
    if (view === "payment" && extraData) {
      if (extraData?.userData?.uid) {
        setActiveRegistration(extraData.userData);
        if (extraData.selectedPath) setSelectedPath(extraData.selectedPath);
      } else if (extraData?.uid) {
        // Sometimes userData passed directly
        setActiveRegistration(extraData);
        if (extraData.path) setSelectedPath(extraData.path);
      }
    }

    // Curriculums path navigation uses a string
    if (typeof extraData === "string") {
      setSelectedPath(extraData);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📝 REGISTRATION -> go to payment
  const handleRegistrationSubmit = (data: any) => {
    setActiveRegistration(data);
    if (data?.path) setSelectedPath(data.path);
    navigateTo("payment");
  };

  // ✅ Called after payment success to update status + refresh profile
  const completePayment = async () => {
    if (!activeRegistration) return;

    await registrationStore.updateStatus(activeRegistration.uid, "Complete");

    // Refresh student profile if this user just paid
    if (studentUser?.uid === activeRegistration.uid) {
      const userDoc = await getDoc(doc(db, "users", activeRegistration.uid));
      if (userDoc.exists()) {
        setStudentProfile(userDoc.data() as RegistrationEntry);
      }
    }
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
      await signInWithEmailAndPassword(auth, email, password);
      navigateTo("student-dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
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