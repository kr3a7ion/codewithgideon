import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { View } from "../src/App";
import { coursePathFromValue } from "../utils/courseRoutes";
import {
  RegistrationEntry,
  registrationStore,
} from "../services/registrationStore";
import { auth, db, setAuthPersistenceMode } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const HANDOFF_KEY = "cwg_registration_handoff";
const ADMIN_SESSION_KEY = "cwg_admin_session_active";
const ADMIN_SESSION_PENDING = "pending";
const ADMIN_SESSION_ACTIVE = "active";
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const viewRoutes: Record<View, string> = {
  home: "/",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
  curriculums: "/courses",
  "course-detail": "/courses",
  "path-flutter": "/courses/flutter-mobile-app-development",
  "path-web": "/courses/web-development-wordpress",
  "path-ai": "/courses/ai-assisted-development",
  registration: "/register",
  payment: "/student/payment",
  "student-login": "/student/login",
  "student-dashboard": "/student/dashboard",
  "admin-login": "/admin/login",
  "admin-dashboard": "/admin",
  "create-account": "/register",
  "continue-registration": "/student/register",
  "verify-email": "/student/verify-email",
};

const cleanPathname = (pathname: string) => {
  const cleaned = String(pathname || "/").replace(/\/+$/, "");
  return cleaned || "/";
};

const viewFromPathname = (pathname: string): View => {
  const path = cleanPathname(pathname);

  if (path === "/") return "home";
  if (path === "/contact") return "contact";
  if (path === "/privacy") return "privacy";
  if (path === "/terms") return "terms";
  if (path === "/refund") return "refund";
  if (path === "/courses") return "curriculums";
  if (path.startsWith("/courses/")) return "course-detail";
  if (path === "/register") return "create-account";
  if (path === "/student/login") return "student-login";
  if (path === "/student/register") return "continue-registration";
  if (path === "/student/verify-email") return "verify-email";
  if (path === "/student/payment") return "payment";
  if (
    path === "/student/dashboard" ||
    path === "/student/classes" ||
    path === "/student/resources" ||
    path === "/student/community" ||
    path === "/student/chat" ||
    path === "/student/notifications" ||
    path === "/student/badges"
  ) {
    return "student-dashboard";
  }
  if (path === "/admin/login") return "admin-login";
  if (path === "/admin" || path.startsWith("/admin/")) return "admin-dashboard";

  return "home";
};

const normalizeView = (view: View): View =>
  view === "registration" ? "create-account" : view;

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

const describeStudentAuthError = (err: any) => {
  const code = String(err?.code || "").toLowerCase();
  const message = String(err?.message || "").trim();
  const lower = message.toLowerCase();

  if (code.includes("popup-closed-by-user")) {
    return "Google sign-in was cancelled before it finished.";
  }
  if (code.includes("popup-blocked")) {
    return "Google sign-in was blocked. Please allow pop-ups and try again.";
  }
  if (code.includes("account-exists-with-different-credential")) {
    return "This email already uses another sign-in method. Sign in with that method first.";
  }
  if (err?.requiresPasswordLink) {
    return String(err?.message || "Sign in with your password once and we will connect Google automatically.");
  }
  if (code.includes("operation-not-allowed")) {
    return "Google sign-in is not enabled in Firebase Authentication yet.";
  }
  if (code.includes("network-request-failed") || lower.includes("network")) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (
    code.includes("wrong-password") ||
    code.includes("invalid-credential") ||
    code.includes("user-not-found")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  return message || "Sign-in failed. Please try again.";
};

export const useAppLogic = () => {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<View>(() =>
    viewFromPathname(location.pathname),
  );
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

  const adminLogoutTimerRef = useRef<number | null>(null);

  const clearAuthBuckets = () => {
    setAdminUser(null);
    setStudentUser(null);
    setStudentProfile(null);
    setVerificationState(null);
  };

  const syncUrlForView = (
    view: View,
    mode: "push" | "replace" = "push",
    extraData?: unknown,
  ) => {
    const nextView = normalizeView(view);
    const nextPath =
      nextView === "course-detail"
        ? coursePathFromValue(
            typeof extraData === "object" && extraData
              ? (extraData as any)
              : { slug: String(extraData || "") },
          )
        : viewRoutes[nextView] || "/";
    const currentPath = cleanPathname(location.pathname);
    if (currentPath === nextPath) return;

    routerNavigate(nextPath, {
      replace: mode === "replace",
      state: { view: nextView, extraData },
    });
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
    const nextView = normalizeView(view);

    if (nextView === "payment") {
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

    syncUrlForView(nextView, "push", extraData);
    setCurrentView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const routeVerifiedStudent = async (user: User) => {
    const profile = await registrationStore.getUserProfile(user.uid);

    if (!profile) {
      navigateTo("continue-registration");
      return;
    }

    setStudentProfile(profile);
    navigateTo("student-dashboard");
  };

  const syncSignedInUser = async (user: User) => {
    const adminSnap = await getDoc(doc(db, "admins", user.uid));

    if (adminSnap.exists()) {
      const adminSessionState = sessionStorage.getItem(ADMIN_SESSION_KEY);

      // Old persisted admin sessions should not revive without an explicit
      // session marker from the current secure admin login flow.
      if (
        adminSessionState != ADMIN_SESSION_PENDING &&
        adminSessionState != ADMIN_SESSION_ACTIVE
      ) {
        await signOut(auth);
        clearAuthBuckets();
        syncUrlForView("admin-login", "replace");
        setCurrentView("admin-login");
        return;
      }

      setVerificationState(null);
      setAdminUser(user);
      setStudentUser(null);
      setStudentProfile(null);
      if (adminSessionState == ADMIN_SESSION_PENDING) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SESSION_ACTIVE);
      }
      return;
    }

    if (!user.emailVerified) {
      setVerificationState({
        role: "student",
        email: String(user.email || "").trim(),
        uid: user.uid,
      });
      setAdminUser(null);
      setStudentUser(null);
      setStudentProfile(null);
      return;
    }

    const userSnap = await getDoc(doc(db, "users", user.uid));

    setVerificationState(null);
    setAdminUser(null);
    setStudentUser(user);
    setStudentProfile(userSnap.exists() ? (userSnap.data() as RegistrationEntry) : null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearAuthBuckets();
        setIsLoadingAuth(false);
        return;
      }

      try {
        await syncSignedInUser(user);
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        clearAuthBuckets();
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    setCurrentView(viewFromPathname(location.pathname));
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (verificationState && currentView !== "verify-email") {
      syncUrlForView("verify-email", "replace");
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
      if (adminLogoutTimerRef.current) {
        window.clearTimeout(adminLogoutTimerRef.current);
      }
      adminLogoutTimerRef.current = null;
      setAdminSessionRemainingMs(0);
      return;
    }

    let idleDeadline = Date.now() + ADMIN_IDLE_TIMEOUT_MS;
    const syncRemaining = () => {
      setAdminSessionRemainingMs(Math.max(0, idleDeadline - Date.now()));
    };

    const resetIdleTimeout = () => {
      if (adminLogoutTimerRef.current) {
        window.clearTimeout(adminLogoutTimerRef.current);
      }
      idleDeadline = Date.now() + ADMIN_IDLE_TIMEOUT_MS;

      adminLogoutTimerRef.current = window.setTimeout(async () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await signOut(auth);
        clearAuthBuckets();
        sessionStorage.setItem(
          "cwg_admin_notice",
          "Admin session expired after 30 minutes of inactivity. Please sign in again.",
        );
        syncUrlForView("admin-login", "replace");
        setCurrentView("admin-login");
      }, ADMIN_IDLE_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimeout, { passive: true });
    });
    resetIdleTimeout();
    syncRemaining();
    const countdownInterval = window.setInterval(syncRemaining, 1000);

    return () => {
      window.clearInterval(countdownInterval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimeout);
      });
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
      // Mark the current admin auth attempt before Firebase emits the auth
      // state event, otherwise the bootstrap listener can reject the first
      // successful login as an unsafe revived session.
      sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SESSION_PENDING);
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const adminSnap = await getDoc(doc(db, "admins", cred.user.uid));
      if (!adminSnap.exists()) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await signOut(auth);
        throw new Error(
          "Admin record missing: create Firestore document admins/" +
            cred.user.uid,
        );
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SESSION_ACTIVE);

      await syncSignedInUser(auth.currentUser || cred.user);
      navigateTo("admin-dashboard");
      return { success: true };
    } catch (err: any) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
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
      // If Google was attempted first for the same email, attach it quietly
      // after the trusted password login succeeds.
      await registrationStore.linkPendingGoogleProviderIfNeeded(cred.user);

      await waitForAuthUid(auth, cred.user.uid, 15000);

      const refreshed = await registrationStore.reloadCurrentUser();
      if (!refreshed?.emailVerified) {
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
      return { success: false, error: describeStudentAuthError(err) };
    }
  };

  const loginStudentWithGoogle = async () => {
    try {
      const snapshot = await registrationStore.signInStudentWithGoogle();
      if (!snapshot.emailVerified) {
        setVerificationState({
          role: "student",
          email: snapshot.email,
          uid: snapshot.uid,
        });
        navigateTo("verify-email");
        return { success: true };
      }

      const activeUser = auth.currentUser;
      if (!activeUser) {
        throw new Error("Google sign-in finished, but the auth session is missing.");
      }

      await syncSignedInUser(activeUser);
      await routeVerifiedStudent(activeUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: describeStudentAuthError(err) };
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

  const refreshVerifiedSession = async () => {
    try {
      const snapshot = await registrationStore.reloadCurrentUser();
      if (!snapshot?.emailVerified) {
        return {
          verified: false,
          error:
            "This email is still unverified. Open the email link, then try again.",
        };
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { verified: false, error: "No signed-in user found." };
      }

      const role = verificationState?.role;
      await syncSignedInUser(currentUser);

      if (role === "admin") {
        navigateTo("admin-dashboard");
      } else {
        await routeVerifiedStudent(currentUser);
      }

      return { verified: true };
    } catch (err: any) {
      return {
        verified: false,
        error: err?.message || "Failed to refresh verification status.",
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
    adminSessionRemainingMs,
    isStudentLoggedIn: !!studentUser,
    isLoadingAuth,
    studentProfile,
    verificationState,

    navigateTo,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin,
    loginStudent,
    loginStudentWithGoogle,
    logoutStudent,
    resendVerificationEmail,
    refreshVerifiedSession,
    logoutPendingVerification,
  };
};
