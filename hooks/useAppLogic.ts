
import { useState, useEffect } from 'react';
import { View } from '../App';
import { RegistrationEntry, registrationStore } from '../services/registrationStore';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const useAppLogic = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [activeRegistration, setActiveRegistration] = useState<RegistrationEntry | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navigateTo = (view: View, path?: string) => {
    if (path) setSelectedPath(path);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSubmit = (data: any) => {
    const weeklyRate = 10000;
    const entry = registrationStore.save({
      ...data,
      weeksToCommit: parseInt(data.weeksToCommit),
      totalPrice: parseInt(data.weeksToCommit) * weeklyRate
    });
    setActiveRegistration(entry);
    navigateTo('payment');
  };

  const completePayment = () => {
    if (activeRegistration) {
      registrationStore.updateStatus(activeRegistration.id, 'Complete');
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigateTo('admin-dashboard');
      return { success: true };
    } catch (error: any) {
      console.error("Auth Error:", error.message);
      return { success: false, error: error.message };
    }
  };

  const logoutAdmin = async () => {
    await signOut(auth);
    navigateTo('home');
  };

  return {
    currentView,
    selectedPath,
    activeRegistration,
    isDark,
    isAdminLoggedIn: !!adminUser,
    isLoadingAuth,
    navigateTo,
    toggleTheme,
    handleRegistrationSubmit,
    completePayment,
    loginAdmin,
    logoutAdmin
  };
};
