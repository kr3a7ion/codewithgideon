import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ErrorBoundary from "../components/ErrorBoundary";
import { AppProvider, useApp } from "./app/AppContext";
import { PageMeta } from "./app/usePageMeta";
import { STUDENT_SECTIONS } from "./app/views";
import { LoadingPanel } from "./ui";
import HomePage from "./pages/HomePage";

export type { View } from "./app/views";

const Contact = lazy(() => import("../components/Contact"));
const PrivacyPolicy = lazy(() => import("../components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../components/TermsOfService"));
const RefundPolicy = lazy(() => import("../components/RefundPolicy"));
const Curriculums = lazy(() => import("../components/Curriculums"));
const CourseDetail = lazy(() => import("../components/CourseDetail"));
const Payment = lazy(() => import("../components/Payment"));
const AdminLogin = lazy(() => import("../components/AdminLogin"));
const AdminDashboard = lazy(() => import("./features/admin/AdminArea"));
const StudentLogin = lazy(() => import("../components/StudentLogin"));
const StudentDashboard = lazy(() => import("./features/learn/StudentArea"));
const CreateAccount = lazy(() => import("../components/CreateAccount"));
const ContinueRegistration = lazy(() => import("../components/ContinueRegistration"));
const VerifyEmail = lazy(() => import("../components/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** Waits for Firebase Auth before rendering a private page. */
const AuthReady: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoadingAuth } = useApp();
  if (isLoadingAuth) return <LoadingPanel label="Signing you in" />;
  return <>{children}</>;
};

/** Student pages: show the login form in place until the student signs in. */
const RequireStudent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isStudentLoggedIn, navigateTo, loginStudent, loginStudentWithGoogle } =
    useApp();
  return (
    <AuthReady>
      {isStudentLoggedIn ? (
        children
      ) : (
        <StudentLogin
          onNavigate={navigateTo}
          onLogin={loginStudent}
          onGoogleAuth={loginStudentWithGoogle}
        />
      )}
    </AuthReady>
  );
};

/** Admin pages: show the admin login in place until an admin signs in. */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdminLoggedIn, navigateTo, loginAdmin } = useApp();
  return (
    <AuthReady>
      {isAdminLoggedIn ? (
        children
      ) : (
        <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />
      )}
    </AuthReady>
  );
};

// ---------------------------------------------------------------------------
// Route elements that need app state
// ---------------------------------------------------------------------------

const StudentLoginPage = () => {
  const { navigateTo, loginStudent, loginStudentWithGoogle } = useApp();
  return (
    <StudentLogin
      onNavigate={navigateTo}
      onLogin={loginStudent}
      onGoogleAuth={loginStudentWithGoogle}
    />
  );
};

const VerifyEmailPage = () => {
  const {
    verificationState,
    navigateTo,
    refreshVerifiedSession,
    resendVerificationEmail,
    logoutPendingVerification,
  } = useApp();
  if (!verificationState) return <StudentLoginPage />;
  return (
    <VerifyEmail
      role={verificationState.role}
      email={verificationState.email}
      onNavigate={navigateTo}
      onRefresh={refreshVerifiedSession}
      onResend={resendVerificationEmail}
      onLogout={logoutPendingVerification}
    />
  );
};

const PaymentPage = () => {
  const { activeRegistration, studentProfile, selectedPath, navigateTo, completePayment } =
    useApp();
  // After a page refresh on /student/payment there is no hand-off data yet,
  // so build the checkout from the signed-in student's profile.
  const paymentUserData: any =
    activeRegistration ||
    (studentProfile
      ? studentProfile.status === "Complete"
        ? {
            ...studentProfile,
            isTopUp: true,
            originalWeeks: Number(studentProfile.weeksToCommit || 0),
            weeksToCommit: 1,
            reference: studentProfile.pendingPayment?.reference,
          }
        : {
            ...studentProfile,
            isTopUp: false,
            reference: studentProfile.pendingPayment?.reference,
          }
      : null);

  return (
    <Payment
      onNavigate={navigateTo}
      selectedPath={paymentUserData?.path || selectedPath}
      userData={paymentUserData}
      onPaymentSuccess={completePayment}
    />
  );
};

const StudentDashboardPage = () => {
  const { studentProfile, navigateTo, logoutStudent } = useApp();
  return (
    <StudentDashboard
      profile={studentProfile}
      onNavigate={navigateTo}
      onLogout={logoutStudent}
    />
  );
};

const AdminDashboardPage = () => {
  const { navigateTo, logoutAdmin, adminSessionRemainingMs } = useApp();
  return (
    <AdminDashboard
      onNavigate={navigateTo}
      onLogout={logoutAdmin}
      sessionRemainingMs={adminSessionRemainingMs}
    />
  );
};

// ---------------------------------------------------------------------------
// Layout + routes
// ---------------------------------------------------------------------------

const AppShell: React.FC = () => {
  const location = useLocation();
  const {
    currentView,
    navigateTo,
    isDark,
    toggleTheme,
    isStudentLoggedIn,
    isAdminLoggedIn,
  } = useApp();

  const privateMeta = { noindex: true };

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors dark:bg-slate-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-blue-900 focus:shadow-lg"
      >
        Skip to content
      </a>

      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isStudentLoggedIn={isStudentLoggedIn}
      />

      <main id="main" className="flex-grow pt-20">
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<LoadingPanel />}>
            <Routes>
              <Route index element={<HomePage />} />

              {/* Public pages */}
              <Route
                path="courses"
                element={
                  <PageMeta
                    title="Courses"
                    description="Choose a learning path: Flutter mobile apps, web development & WordPress, or AI-assisted development. Live cohorts with a mentor."
                  >
                    <Curriculums onNavigate={navigateTo} />
                  </PageMeta>
                }
              />
              <Route
                path="courses/:courseSlug"
                element={<CourseDetail onNavigate={navigateTo} />}
              />
              <Route
                path="contact"
                element={
                  <PageMeta title="Contact" description="Questions about a course, payment or your account? Send us a message.">
                    <Contact />
                  </PageMeta>
                }
              />
              <Route path="privacy" element={<PageMeta title="Privacy Policy"><PrivacyPolicy /></PageMeta>} />
              <Route path="terms" element={<PageMeta title="Terms of Service"><TermsOfService /></PageMeta>} />
              <Route path="refund" element={<PageMeta title="Refund Policy"><RefundPolicy /></PageMeta>} />

              {/* Legacy course URLs */}
              <Route path="path-flutter" element={<Navigate to="/courses/flutter-mobile-app-development" replace />} />
              <Route path="path-web" element={<Navigate to="/courses/web-development-wordpress" replace />} />
              <Route path="path-ai" element={<Navigate to="/courses/ai-assisted-development" replace />} />

              {/* Sign-up and sign-in */}
              <Route
                path="register"
                element={
                  <PageMeta title="Create account" description="Create your Code with Gideon account and join the next cohort.">
                    <CreateAccountRoute />
                  </PageMeta>
                }
              />
              <Route path="student/login" element={<PageMeta title="Student login" {...privateMeta}><StudentLoginPage /></PageMeta>} />
              <Route path="student/verify-email" element={<PageMeta title="Verify your email" {...privateMeta}><VerifyEmailPage /></PageMeta>} />
              <Route
                path="student/register"
                element={
                  <PageMeta title="Complete registration" {...privateMeta}>
                    <ContinueRegistrationRoute />
                  </PageMeta>
                }
              />

              {/* Student area */}
              <Route
                path="student/payment"
                element={
                  <PageMeta title="Payment" {...privateMeta}>
                    <AuthReady>
                      <PaymentPage />
                    </AuthReady>
                  </PageMeta>
                }
              />
              <Route path="student" element={<Navigate to="/student/dashboard" replace />} />
              {STUDENT_SECTIONS.map((section) => (
                <Route
                  key={section}
                  path={`student/${section}`}
                  element={
                    <PageMeta title="My learning" {...privateMeta}>
                      <RequireStudent>
                        <StudentDashboardPage />
                      </RequireStudent>
                    </PageMeta>
                  }
                />
              ))}

              {/* Admin */}
              <Route
                path="admin/login"
                element={
                  <PageMeta title="Admin" {...privateMeta}>
                    <AdminLoginRoute />
                  </PageMeta>
                }
              />
              <Route
                path="admin/*"
                element={
                  <PageMeta title="Admin" {...privateMeta}>
                    <RequireAdmin>
                      <AdminDashboardPage />
                    </RequireAdmin>
                  </PageMeta>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer onNavigate={navigateTo} isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
};

const CreateAccountRoute = () => {
  const { navigateTo, loginStudentWithGoogle } = useApp();
  return <CreateAccount onNavigate={navigateTo} onGoogleAuth={loginStudentWithGoogle} />;
};

const ContinueRegistrationRoute = () => {
  const { navigateTo, selectedPath, loginStudentWithGoogle } = useApp();
  return (
    <ContinueRegistration
      onNavigate={navigateTo}
      selectedPath={selectedPath}
      onGoogleAuth={loginStudentWithGoogle}
    />
  );
};

const AdminLoginRoute = () => {
  const { navigateTo, loginAdmin } = useApp();
  return <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />;
};

const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
