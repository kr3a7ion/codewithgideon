// Preview stand-in for src/app/AppContext: a fixed signed-in (or, with
// ?auth=out, signed-out) student so the join pages render without Firebase.
import React from "react";
import { previewProfile } from "./data";

const params = new URLSearchParams(window.location.search);
const signedOut = params.get("auth") === "out";
const noProfile = params.get("profile") === "none";
const log = (name: string) => (...args: unknown[]) => console.log(name, ...args);

const value: any = {
  isLoadingAuth: false,
  isStudentLoggedIn: !signedOut,
  isAdminLoggedIn: false,
  studentAccount: signedOut ? null : { uid: previewProfile.uid, email: previewProfile.email },
  studentProfile: signedOut || noProfile ? null : previewProfile,
  selectedPath: params.get("course") || "",
  activeRegistration: null,
  verificationState: { role: "student", email: previewProfile.email, uid: previewProfile.uid },
  isDark: document.documentElement.classList.contains("dark"),
  toggleTheme: () => document.documentElement.classList.toggle("dark"),
  navigateTo: log("navigate"),
  completePayment: log("completePayment"),
  loginStudent: async () => ({ success: false, error: "Preview only: sign-in is turned off." }),
  loginStudentWithGoogle: async () => ({ success: false, error: "Preview only: Google sign-in is turned off." }),
  logoutStudent: log("logout"),
  refreshVerifiedSession: async () => ({ verified: false }),
  resendVerificationEmail: async () => ({ success: true }),
  logoutPendingVerification: async () => undefined,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const useApp = () => value;
