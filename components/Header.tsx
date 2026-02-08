import React, { useState, useEffect } from "react";
import { View } from "../App";
import { IMAGES } from "../assets/images";

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isStudentLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isDark,
  onToggleTheme,
  isStudentLoggedIn = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Close mobile menu when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false); // md breakpoint
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ✅ Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();

    const scroll = () => {
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 80;
      const offsetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    };

    if (currentView !== "home") {
      onNavigate("home");
      setTimeout(scroll, 100);
    } else {
      scroll();
    }

    setIsMobileMenuOpen(false);
  };

  const navItems = ["how-it-works", "courses", "pricing", "faq"] as const;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen || currentView !== "home"
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="w-full px-6 md:px-12 lg:px-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center space-x-2 group"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:scale-110 transition-transform">
            <img src={IMAGES.logo} alt="Code with Gideon Logo" />
          </div>
          <span className="font-bold text-xl text-blue-900 dark:text-white">
            CodeWithGideon
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-8">
          {navItems.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-teal-400 font-medium"
            >
              {id.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-5">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {isStudentLoggedIn ? (
            <button
              onClick={() => onNavigate("student-dashboard")}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg font-bold transition"
            >
              My Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate("student-login")}
                className="font-bold text-blue-900 dark:text-teal-400"
              >
                Login
              </button>
              <a
                href="#courses"
                onClick={(e) => scrollToSection(e, "courses")}
                className="bg-blue-900 dark:bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold"
              >
                Join Now
              </a>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Theme toggle (mobile) */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Menu toggle */}
          <button
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            title={isMobileMenuOpen ? "Close menu" : "Menu"}
          >
            {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-xl px-6 py-6 space-y-4 border-t border-gray-100 dark:border-slate-800">
          {navItems.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className="block text-lg font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-900 dark:hover:text-teal-400"
            >
              {id.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </a>
          ))}

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800" />

          {isStudentLoggedIn ? (
            <button
              onClick={() => {
                onNavigate("student-dashboard");
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-xl font-bold transition"
            >
              My Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  onNavigate("student-login");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full font-bold py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                Student Login
              </button>

              <a
                href="#courses"
                onClick={(e) => scrollToSection(e, "courses")}
                className="w-full bg-blue-900 dark:bg-teal-600 text-white py-4 rounded-xl font-bold text-center block"
              >
                Join the Next Cohort
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700 dark:text-slate-200">
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M5 19l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700 dark:text-slate-200">
      <path
        d="M21 12.8A8.5 8.5 0 0 1 11.2 3 7 7 0 1 0 21 12.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700 dark:text-slate-200">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700 dark:text-slate-200">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default Header;