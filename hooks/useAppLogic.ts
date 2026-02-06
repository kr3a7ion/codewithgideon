import { useEffect, useState } from "react";
import { View } from "../App";
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

export const useAppLogic = () => {
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedPath, setSelectedPath] = useState("");
  const [activeRegistration, setActiveRegistration] =
    useState<RegistrationEntry | null>(null);

  // 🔐 ADMIN AUTH
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // 🌗 THEME STATE (✅ FIX)
  const [isDark, setIsDark] = useState(false);

  // 🔐 AUTH LISTENER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsLoadingAuth(false);
    });
    return unsub;
  }, []);

  // 🌗 THEME INIT (✅ FIX)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const dark =
      savedTheme === "dark" || (!savedTheme && prefersDark);

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

  // 🧭 NAVIGATION
  const navigateTo = (view: View, path?: string) => {
    if (path) setSelectedPath(path);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📝 REGISTRATION
  const handleRegistrationSubmit = (data: any) => {
    setActiveRegistration(data);
    navigateTo("payment");
  };

  const completePayment = async () => {
    if (activeRegistration) {
      await registrationStore.updateStatus(
        activeRegistration.uid,
        "Complete"
      );
    }
  };

  // 🔐 ADMIN LOGIN WITH ROLE CHECK
  const loginAdmin = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = cred.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data();

      if (userData.role !== "admin") {
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

  // ✅ RETURN CONTRACT (FIXES YOUR ERROR)
  return {
    currentView,
    selectedPath,
    activeRegistration,

    // 🌗 THEME
    isDark,
    toggleTheme,

    // 🔐 ADMIN
    isAdminLoggedIn: !!adminUser,
    isLoadingAuth,

    // 🧭 ACTIONS
    navigateTo,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin,
  };
};