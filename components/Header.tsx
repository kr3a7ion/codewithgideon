import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { IMAGES } from '../assets/images';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, isDark, onToggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (currentView !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          // Fix: renamed elementPosition to offsetPosition to match usage on line 33
          const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen || currentView !== 'home' 
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-4' 
        : 'bg-transparent py-6'
      }`}
    >
      <div className="w-full px-6 md:px-12 lg:px-16 flex items-center justify-between">
        <a 
          href="javascript:void(0)" 
          onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
          className="flex items-center space-x-2 group"
        >
          <div className="w-10 h-10 overflow-hidden rounded-lg group-hover:scale-110 transition-transform">
            <img 
              src={IMAGES.logo} 
              alt="Code with Gideon Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-blue-900 dark:text-white">
            CodeWithGideon
          </span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium transition-colors">How It Works</a>
          <a href="#courses" onClick={(e) => scrollToSection(e, 'courses')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium transition-colors">Courses</a>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium transition-colors">Pricing</a>
          <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium transition-colors">FAQ</a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-5">
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <a 
            href="#courses"
            onClick={(e) => scrollToSection(e, 'courses')}
            className="bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md"
          >
            Join Now
          </a>
        </div>

        {/* Mobile Toggle & Actions */}
        <div className="flex items-center space-x-3 md:hidden">
          <button 
            onClick={onToggleTheme} 
            className="p-2 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button 
            className="text-blue-900 dark:text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 absolute top-full left-0 right-0 py-6 px-6 flex flex-col space-y-4 shadow-xl">
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium text-lg py-2 border-b border-gray-50 dark:border-slate-800">How It Works</a>
          <a href="#courses" onClick={(e) => scrollToSection(e, 'courses')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium text-lg py-2 border-b border-gray-50 dark:border-slate-800">Courses</a>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium text-lg py-2 border-b border-gray-50 dark:border-slate-800">Pricing</a>
          <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium text-lg py-2 border-b border-gray-50 dark:border-slate-800">FAQ</a>
          <div className="pt-4 flex flex-col space-y-3">
            <a 
              href="#courses"
              onClick={(e) => scrollToSection(e, 'courses')}
              className="w-full bg-blue-900 dark:bg-teal-600 text-white text-center font-bold py-4 rounded-xl shadow-md"
            >
              Join the Next Cohort
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;