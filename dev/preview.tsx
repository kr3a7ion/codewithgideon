// UI preview: renders app screens with sample data (no Firebase needed).
//   npm run preview:ui  ->  http://localhost:5174/student/dashboard?state=active&theme=dark
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "../src/index.css";
import StudentArea from "../src/features/learn/StudentArea";
import AdminArea from "../src/features/admin/AdminArea";
import CreateAccountPage from "../src/features/join/CreateAccountPage";
import LoginPage from "../src/features/join/LoginPage";
import VerifyEmailPage from "../src/features/join/VerifyEmailPage";
import DetailsPage from "../src/features/join/DetailsPage";
import PaymentPage from "../src/features/join/PaymentPage";
import { previewProfile } from "./mocks/data";
import { BadgeMedal, type MedalState } from "../src/features/learn/BadgeMedal";
import { getBadgesForLength } from "../src/features/learn/lib";

/** Every badge medal in every state, for checking the artwork. */
const BadgeGallery = () => {
  const badges = getBadgesForLength(12);
  const states: MedalState[] = ["latest", "earned", "next", "locked"];
  return (
    <div className="student-app min-h-screen bg-mist p-8 dark:bg-paper-dark">
      {states.map((st) => (
        <section key={st} className="mb-8">
          <p className="mb-3 font-bold text-blue-900 dark:text-white">{st}</p>
          <div className={st === "latest" ? "flex flex-wrap gap-6 rounded-3xl bg-blue-900 p-6" : "flex flex-wrap gap-6 rounded-3xl bg-white p-6 dark:bg-slate-900"}>
            {badges.map((b) => (
              <div key={b.week} className="flex w-[120px] flex-col items-center gap-2" data-medal={`${b.week}-${st}`}>
                <BadgeMedal badge={b} state={st} size={120} />
                <span className={st === "latest" ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-600 dark:text-slate-300"}>{b.title}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-blue-900 p-4">
        {badges.map((b) => (
          <BadgeMedal key={b.week} badge={b} size={26} />
        ))}
      </div>
    </div>
  );
};

const params = new URLSearchParams(window.location.search);
const log = (name: string) => (...args: unknown[]) => console.log(name, ...args);
const noGoogle = async () => ({ success: false, error: "Preview only: Google sign-in is turned off." });

const Student = () => (
  <StudentArea
    profile={params.get("profile") === "none" ? null : previewProfile}
    onNavigate={log("navigate")}
    onLogout={log("logout")}
    isDark={document.documentElement.classList.contains("dark")}
    onToggleTheme={() => document.documentElement.classList.toggle("dark")}
  />
);

// /student/payment?mode=topup&phase=success|verifying|review|failed&stage=verify
const Payment = () => {
  const topUp = params.get("mode") === "topup";
  const phase = (params.get("phase") || "idle") as any;
  return (
    <PaymentPage
      onNavigate={log("navigate")}
      selectedPath={previewProfile.path}
      onPaymentSuccess={log("paid")}
      preview={{ phase, failedStage: (params.get("stage") as any) || "start", reference: "CWG_MFX2K_1A2B" }}
      userData={{
        uid: previewProfile.uid,
        email: previewProfile.email,
        fullName: previewProfile.fullName,
        phone: previewProfile.phone,
        path: previewProfile.path,
        pathId: previewProfile.pathId,
        courseId: previewProfile.courseId,
        courseTitle: "Flutter & Mobile App Development",
        cohortId: previewProfile.cohortId,
        cohortKey: previewProfile.cohortKey,
        cohortLabel: previewProfile.cohortLabel,
        courseDurationWeeks: 12,
        weeklyRate: 10000,
        weeksToCommit: topUp ? 2 : 4,
        isTopUp: topUp,
        originalWeeks: topUp ? 5 : 0,
      }}
    />
  );
};

const screens = [
  ["/register?auth=out", "Create account"],
  ["/student/login", "Log in"],
  ["/student/verify-email", "Check your email"],
  ["/student/register?state=locked", "Your details"],
  ["/student/payment?state=locked", "Review and pay"],
  ["/student/payment?mode=topup", "Add weeks (checkout)"],
  ["/student/payment?phase=success", "You're in"],
  ["/student/payment?mode=topup&phase=success", "Weeks added"],
  ["/student/payment?state=locked&phase=verifying", "Confirming payment"],
  ["/student/payment?state=checking", "Payment being checked"],
  ["/student/payment?state=locked&phase=failed&stage=verify", "Couldn't confirm"],
  ["/student/dashboard", "Home (active)"],
  ["/student/dashboard?state=locked", "Home (pending)"],
  ["/student/dashboard?state=checking", "Home (checking)"],
  ["/badges-gallery", "Badge medals (every state)"],
  ["/student/classes", "Classes"],
  ["/student/chat", "Mentor chat"],
  ["/student/resources", "Resources"],
  ["/student/notifications", "Updates"],
  ["/student/community", "Community"],
  ["/student/badges", "Badges"],
  ["/student/account", "Payments & account"],
  ["/student/more", "More"],
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<CreateAccountPage onNavigate={log("navigate")} onGoogleAuth={noGoogle} />} />
        <Route path="/student/login" element={<LoginPage onNavigate={log("navigate")} onLogin={noGoogle} onGoogleAuth={noGoogle} />} />
        <Route
          path="/student/verify-email"
          element={
            <VerifyEmailPage
              role="student"
              email={previewProfile.email}
              onNavigate={log("navigate")}
              onRefresh={async () => ({ verified: false })}
              onResend={async () => ({ success: true })}
              onLogout={async () => undefined}
            />
          }
        />
        <Route path="/student/register" element={<DetailsPage onNavigate={log("navigate")} selectedPath="" onGoogleAuth={noGoogle} />} />
        <Route path="/student/payment" element={<Payment />} />
        <Route path="/badges-gallery" element={<BadgeGallery />} />
        <Route path="/student/*" element={<Student />} />
        <Route
          path="/admin/*"
          element={<AdminArea onNavigate={() => undefined} onLogout={() => undefined} sessionRemainingMs={25 * 60_000} />}
        />
        <Route
          path="*"
          element={
            <div className="p-10">
              <p className="font-bold">Preview screens</p>
              <ul className="mt-3 list-disc pl-6">
                {screens.map(([href, label]) => (
                  <li key={href}>
                    <a className="text-teal-600 underline" href={href}>
                      {label}
                    </a>{" "}
                    <span className="text-sm text-slate-500">{href}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-500">
                Student states: ?state=active | locked | checking | empty. Add &amp;theme=dark for dark mode.
              </p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
