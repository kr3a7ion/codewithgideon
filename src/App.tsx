import React, { Suspense, lazy } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import WhyGideon from '../components/WhyGideon';
import Features from '../components/Features';
import Courses from '../components/Courses';
import Pricing from '../components/Pricing';
import InstructorBio from '../components/InstructorBio';
import AppPreview from '../components/AppPreview';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import { useAppLogic } from '../hooks/useAppLogic';

const Contact = lazy(() => import('../components/Contact'));
const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../components/TermsOfService'));
const RefundPolicy = lazy(() => import('../components/RefundPolicy'));
const Curriculums = lazy(() => import('../components/Curriculums'));
const CourseDetail = lazy(() => import('../components/CourseDetail'));
const Payment = lazy(() => import('../components/Payment'));
const AdminLogin = lazy(() => import('../components/AdminLogin'));
const AdminDashboard = lazy(() => import('../components/AdminDashboard'));
const StudentLogin = lazy(() => import('../components/StudentLogin'));
const StudentDashboard = lazy(() => import('../components/StudentDashboard'));
const CreateAccount = lazy(() => import('@/components/CreateAccount'));
const ContinueRegistration = lazy(() => import('@/components/ContinueRegistration'));
const VerifyEmail = lazy(() => import('../components/VerifyEmail'));

export type View =
  | "home"
  | "contact"
  | "privacy"
  | "terms"
  | "refund"
  | "curriculums"
  | "course-detail"
  | "path-flutter"
  | "path-web"
  | "path-ai"
  | "registration"
  | "payment"
  | "student-login"
  | "student-dashboard"
  | "admin-login"
  | "admin-dashboard"
  | "create-account"
  | "continue-registration"
  | "verify-email";

const App: React.FC = () => {
  const {
    currentView,
    selectedPath,
    activeRegistration,

    // 🌗 Theme
    isDark,
    toggleTheme,

    // 🔐 Auth
    isAdminLoggedIn,
    adminSessionRemainingMs,
    isStudentLoggedIn,
    studentProfile,
    verificationState,

    // 🧭 Actions
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
  } = useAppLogic();

  const routeFallback = (
    <div className="min-h-[55vh] px-6 py-20">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-5 h-12 w-12 rounded-2xl border-4 border-slate-200 border-t-blue-900 dark:border-slate-700 dark:border-t-teal-400 animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-900 dark:text-teal-300">
          Loading workspace
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Preparing this section for you.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isStudentLoggedIn={isStudentLoggedIn}
      />

      <main className="flex-grow pt-20">
        <Suspense fallback={routeFallback}>
        {/* HOME */}
        {currentView === "home" && (
          <>
            <Hero />
            <HowItWorks />
            <WhyGideon />
            <Features />
            <Courses onNavigate={navigateTo} />
            <Pricing onNavigate={navigateTo} />
            <InstructorBio />
            <AppPreview />
            <FAQ />

            <section className="bg-blue-900 dark:bg-slate-950 py-24 text-center">
              <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  You don’t have to learn alone.
                </h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto opacity-90">
                  Join a cohort of motivated learners and professional mentors.
                  The next class starts soon—reserve your seat today.
                </p>
                <button
                  onClick={() => navigateTo("curriculums")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Join Code with Gideon
                </button>
              </div>
            </section>
          </>
        )}

        {/* STATIC PAGES */}
        {currentView === "contact" && <Contact />}
        {currentView === "privacy" && <PrivacyPolicy />}
        {currentView === "terms" && <TermsOfService />}
        {currentView === "refund" && <RefundPolicy />}

        {/* CURRICULUM */}
        {currentView === "curriculums" && (
          <Curriculums onNavigate={navigateTo} />
        )}
        {(currentView === "course-detail" ||
          currentView === "path-flutter" ||
          currentView === "path-web" ||
          currentView === "path-ai") && <CourseDetail onNavigate={navigateTo} />}

        {/* REGISTRATION */}
        {currentView === "create-account" && (
          <CreateAccount
            onNavigate={navigateTo}
            onGoogleAuth={loginStudentWithGoogle}
          />
        )}

        {currentView === "verify-email" &&
          (verificationState ? (
            <VerifyEmail
              role={verificationState.role}
              email={verificationState.email}
              onNavigate={navigateTo}
              onRefresh={refreshVerifiedSession}
              onResend={resendVerificationEmail}
              onLogout={logoutPendingVerification}
            />
          ) : (
            <StudentLogin
              onNavigate={navigateTo}
              onLogin={loginStudent}
              onGoogleAuth={loginStudentWithGoogle}
            />
          ))}

        {currentView === "continue-registration" &&
          (
            <ContinueRegistration
              onNavigate={navigateTo}
              selectedPath={selectedPath}
              onGoogleAuth={loginStudentWithGoogle}
            />
          )}

        {/* STUDENT AUTH */}
        {currentView === "student-login" && (
          <StudentLogin
            onNavigate={navigateTo}
            onLogin={loginStudent}
            onGoogleAuth={loginStudentWithGoogle}
          />
        )}

        {currentView === "student-dashboard" &&
          (isStudentLoggedIn ? (
            <StudentDashboard
              profile={studentProfile}
              onNavigate={navigateTo}
              onLogout={logoutStudent}
            />
          ) : (
            <StudentLogin
              onNavigate={navigateTo}
              onLogin={loginStudent}
              onGoogleAuth={loginStudentWithGoogle}
            />
          ))}

        {/* PAYMENT */}
        {currentView === "payment" && (
          <Payment
            onNavigate={navigateTo}
            selectedPath={(activeRegistration as any)?.path || selectedPath}
            userData={activeRegistration as any}
            onPaymentSuccess={completePayment}
          />
        )}

        {/* ADMIN AUTH */}
        {currentView === "admin-login" && (
          <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />
        )}

        {currentView === "admin-dashboard" &&
          (isAdminLoggedIn ? (
            <AdminDashboard
              onNavigate={navigateTo}
              onLogout={logoutAdmin}
              sessionRemainingMs={adminSessionRemainingMs}
            />
          ) : (
            <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />
          ))}
        </Suspense>
      </main>

      <Footer onNavigate={navigateTo} isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
};

export default App;
