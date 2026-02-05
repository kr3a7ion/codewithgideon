
import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyGideon from './components/WhyGideon';
import Features from './components/Features';
import Courses from './components/Courses';
import Pricing from './components/Pricing';
import InstructorBio from './components/InstructorBio';
import AppPreview from './components/AppPreview';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Contact from './components/Contact';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import RefundPolicy from './components/RefundPolicy';
import Curriculums from './components/Curriculums';
import PathFlutter from './components/PathFlutter';
import PathWeb from './components/PathWeb';
import PathAI from './components/PathAI';
import Registration from './components/Registration';
import Payment from './components/Payment';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { useAppLogic } from './hooks/useAppLogic';

export type View = 'home' | 'contact' | 'privacy' | 'terms' | 'refund' | 'curriculums' | 'path-flutter' | 'path-web' | 'path-ai' | 'registration' | 'payment' | 'admin-login' | 'admin-dashboard';

const App: React.FC = () => {
  const {
    currentView,
    selectedPath,
    activeRegistration,
    isDark,
    isAdminLoggedIn,
    navigateTo,
    toggleTheme,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin
  } = useAppLogic();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
      <Header currentView={currentView} onNavigate={navigateTo} isDark={isDark} onToggleTheme={toggleTheme} />
      
      <main className="flex-grow pt-20">
        {currentView === 'home' && (
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
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">You don’t have to learn alone.</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto opacity-90">
                  Join a cohort of motivated learners and professional mentors. 
                  The next class starts soon—reserve your seat today.
                </p>
                <button 
                  onClick={() => navigateTo('curriculums')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Join Code with Gideon
                </button>
              </div>
            </section>
          </>
        )}

        {currentView === 'contact' && <Contact />}
        {currentView === 'privacy' && <PrivacyPolicy />}
        {currentView === 'terms' && <TermsOfService />}
        {currentView === 'refund' && <RefundPolicy />}
        {currentView === 'curriculums' && <Curriculums onNavigate={navigateTo} />}
        {currentView === 'path-flutter' && <PathFlutter onNavigate={navigateTo} />}
        {currentView === 'path-web' && <PathWeb onNavigate={navigateTo} />}
        {currentView === 'path-ai' && <PathAI onNavigate={navigateTo} />}
        
        {currentView === 'registration' && (
          <Registration 
            onNavigate={navigateTo} 
            selectedPath={selectedPath} 
            onComplete={handleRegistrationSubmit} 
          />
        )}
        
        {currentView === 'payment' && (
          <Payment 
            onNavigate={navigateTo} 
            selectedPath={selectedPath} 
            userData={activeRegistration}
            onPaymentSuccess={completePayment}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />
        )}

        {currentView === 'admin-dashboard' && (
          isAdminLoggedIn ? (
            <AdminDashboard onNavigate={navigateTo} onLogout={logoutAdmin} />
          ) : (
            <AdminLogin onNavigate={navigateTo} onLogin={loginAdmin} />
          )
        )}
      </main>

      <Footer onNavigate={navigateTo} isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
};

export default App;
