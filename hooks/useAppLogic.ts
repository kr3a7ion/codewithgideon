import { useEffect, useRef, useState } from "react";
import { View } from "../src/App";
import {
  RegistrationEntry,
  registrationStore,
} from "../services/registrationStore";
import { auth, db, setAuthPersistenceMode } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const HANDOFF_KEY = "cwg_registration_handoff";
const ADMIN_SESSION_KEY = "cwg_admin_session_active";
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

type VerificationState = {
  role: "admin" | "student";
  email: string;
  uid: string;
} | null;

const safeJsonParse = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function waitForAuthUid(authRef: typeof auth, expectedUid: string, timeoutMs = 8000) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const unsub = onAuthStateChanged(authRef, (user) => {
      if (user?.uid === expectedUid) {
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
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedPath, setSelectedPath] = useState("");
  const [activeRegistration, setActiveRegistration] =
    useState<RegistrationEntry | null>(null);

  const [isDark, setIsDark] = useState(false);

  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] =
    useState<RegistrationEntry | null>(null);
  const [verificationState, setVerificationState] =
    useState<VerificationState>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminSessionRemainingMs, setAdminSessionRemainingMs] = useState(0);

  const adminDeadlineRef = useRef<number | null>(null);
  const adminLogoutTimerRef = useRef<number | null>(null);

  const resetAuthState = () => {
    setAdminUser(null);
    setStudentUser(null);
    setStudentProfile(null);
    setVerificationState(null);
    setAdminSessionRemainingMs(0);
  };

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
        hydrateRegistrationFromHandoff();
      }
    }

    if (typeof extraData === "string") {
      setSelectedPath(extraData);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const routeVerifiedStudent = async (user: User) => {
    const profile = await registrationStore.getUserProfile(user.uid);

    if (!profile) {
      navigateTo("continue-registration");
    } else {
      setStudentProfile(profile);
      navigateTo("student-dashboard");
    }
  };

  const syncSignedInUser = async (user: User) => {
    const adminSnap = await getDoc(doc(db, "admins", user.uid));

    if (adminSnap.exists()) {
      if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
        await signOut(auth);
        resetAuthState();
        setCurrentView("admin-login");
        return;
      }

      if (!user.emailVerified) {
        setAdminUser(null);
        setStudentUser(null);
        setStudentProfile(null);
        setVerificationState({
          role: "admin",
          email: String(user.email || "").trim(),
          uid: user.uid,
        });
        return;
      }

      setVerificationState(null);
      setAdminUser(user);
      setStudentUser(null);
      setStudentProfile(null);
      return;
    }

    if (!user.emailVerified) {
      setAdminUser(null);
      setStudentUser(null);
      setStudentProfile(null);
      setVerificationState({
        role: "student",
        email: String(user.email || "").trim(),
        uid: user.uid,
      });
      return;
    }

    const userSnap = await getDoc(doc(db, "users", user.uid));
    setVerificationState(null);
    setAdminUser(null);
    setStudentUser(user);
    setStudentProfile(userSnap.exists() ? (userSnap.data() as RegistrationEntry) : null);
  };

  const refreshVerifiedSession = async () => {
    try {
      const snapshot = await registrationStore.reloadCurrentUser();
      if (!snapshot) {
        return { verified: false, error: "No signed-in user found." };
      }

      if (!snapshot.emailVerified) {
        return {
          verified: false,
          error:
            "This email is still unverified. Open the verification link, then try again.",
        };
      }

      if (!auth.currentUser) {
        return { verified: false, error: "No signed-in user found." };
      }

      await syncSignedInUser(auth.currentUser);

      if (verificationState?.role === "admin") {
        navigateTo("admin-dashboard");
      } else {
        await routeVerifiedStudent(auth.currentUser);
      }

      return { verified: true };
    } catch (err: any) {
      return {
        verified: false,
        error: err?.message || "Failed to refresh verification status.",
      };
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resetAuthState();
        setIsLoadingAuth(false);
        return;
      }

      try {
        await syncSignedInUser(user);
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        resetAuthState();
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (verificationState && currentView !== "verify-email") {
      setCurrentView("verify-email");
    }
  }, [verificationState, currentView]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const dark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    if (!adminUser) {
      adminDeadlineRef.current = null;
      if (adminLogoutTimerRef.current) {
        window.clearTimeout(adminLogoutTimerRef.current);
      }
      adminLogoutTimerRef.current = null;
      setAdminSessionRemainingMs(0);
      return;
    }

    const scheduleExpiry = () => {
      const deadline = Date.now() + ADMIN_IDLE_TIMEOUT_MS;
      adminDeadlineRef.current = deadline;
      setAdminSessionRemainingMs(ADMIN_IDLE_TIMEOUT_MS);

      if (adminLogoutTimerRef.current) {
        window.clearTimeout(adminLogoutTimerRef.current);
      }

      adminLogoutTimerRef.current = window.setTimeout(async () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await signOut(auth);
        resetAuthState();
        setCurrentView("admin-login");
        window.alert("Admin session expired after 30 minutes of inactivity.");
      }, ADMIN_IDLE_TIMEOUT_MS);
    };

    const handleActivity = () => {
      scheduleExpiry();
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    scheduleExpiry();

    const ticker = window.setInterval(() => {
      const deadline = adminDeadlineRef.current;
      setAdminSessionRemainingMs(deadline ? Math.max(0, deadline - Date.now()) : 0);
    }, 1000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.clearInterval(ticker);
      if (adminLogoutTimerRef.current) {
        window.clearTimeout(adminLogoutTimerRef.current);
      }
    };
  }, [adminUser]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleRegistrationSubmit = (data: any) => {
    const handoff = data?.handoff ?? data;
    if (handoff?.uid) setActiveRegistration(handoff);
    if (handoff?.path) setSelectedPath(handoff.path);
    navigateTo("student-login");
  };

  const completePayment = async () => {
    if (!activeRegistration) return;

    if (studentUser?.uid === activeRegistration.uid) {
      const userDoc = await getDoc(doc(db, "users", activeRegistration.uid));
      if (userDoc.exists()) {
        setStudentProfile(userDoc.data() as RegistrationEntry);
      }
    }

    localStorage.removeItem(HANDOFF_KEY);
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      await setAuthPersistenceMode("session");
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const adminSnap = await getDoc(doc(db, "admins", cred.user.uid));
      if (!adminSnap.exists()) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await signOut(auth);
        throw new Error("Access denied: Admins only");
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, "active");

      const reloaded = await registrationStore.reloadCurrentUser();
      if (!reloaded?.emailVerified) {
        setVerificationState({
          role: "admin",
          email: String(cred.user.email || "").trim(),
          uid: cred.user.uid,
        });
        navigateTo("verify-email");
        return { success: true };
      }

      await syncSignedInUser(auth.currentUser || cred.user);
      navigateTo("admin-dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logoutAdmin = async () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    await signOut(auth);
    navigateTo("home");
  };

  const loginStudent = async (email: string, password: string) => {
    try {
      await setAuthPersistenceMode("local");
      const cred = await signInWithEmailAndPassword(auth, email, password);

      await waitForAuthUid(auth, cred.user.uid, 15000);

      const reloaded = await registrationStore.reloadCurrentUser();
      if (!reloaded?.emailVerified) {
        setVerificationState({
          role: "student",
          email: String(cred.user.email || "").trim(),
          uid: cred.user.uid,
        });
        navigateTo("verify-email");
        return { success: true };
      }

      const activeUser = auth.currentUser || cred.user;
      await syncSignedInUser(activeUser);
      await routeVerifiedStudent(activeUser);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login failed" };
    }
  };

  const logoutStudent = async () => {
    await signOut(auth);
    navigateTo("home");
  };

  const resendVerificationEmail = async () => {
    try {
      await registrationStore.sendCurrentUserVerificationEmail();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Could not resend verification email.",
      };
    }
  };

  const logoutPendingVerification = async () => {
    if (verificationState?.role === "admin") {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    await signOut(auth);
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
    verificationState,
    adminSessionRemainingMs,

    navigateTo,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin,
    loginStudent,
    logoutStudent,
    resendVerificationEmail,
    refreshVerifiedSession,
    logoutPendingVerification,
  };
};
