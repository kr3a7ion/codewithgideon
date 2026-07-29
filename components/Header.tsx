import React, { useState, useEffect } from "react";
import { View } from "../src/App";
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
          ? "bg-transparent py-4"
          : "bg-transparent py-5"
      }`}
    >
      <div className="w-full px-4 md:px-8 lg:px-10">
        <div
          className={`mx-auto flex w-full max-w-[1360px] items-center justify-between rounded-[24px] border px-4 py-3.5 md:px-6 md:py-4 transition-all duration-300 ${
            isScrolled || isMobileMenuOpen || currentView !== "home"
              ? "border-slate-200/80 bg-white/78 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/78"
              : "border-white/18 bg-white/10 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/35"
          }`}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
              setIsMobileMenuOpen(false);
            }}
            className="group flex items-center gap-3"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/85 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-slate-700/80 dark:bg-slate-900/90">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/8 via-transparent to-teal-400/10" />
              <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                <img src={IMAGES.logo} alt="Code with Gideon Logo" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white md:text-[1.15rem]">
                CodeWithGideon
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-2 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/70 md:flex">
            {navItems.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {id.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="rounded-2xl border border-slate-200/80 bg-white/78 p-2.5 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {isStudentLoggedIn ? (
              <button
                onClick={() => onNavigate("student-dashboard")}
                className="rounded-2xl bg-gradient-to-r from-slate-950 via-sky-900 to-teal-700 px-6 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(8,47,73,0.28)] transition hover:-translate-y-0.5 dark:from-teal-500 dark:via-teal-600 dark:to-cyan-500"
              >
                My Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("student-login")}
                  className="rounded-full px-3 py-2 text-sm font-bold text-slate-800 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
                >
                  Login
                </button>
                <a
                  href="#courses"
                  onClick={(e) => scrollToSection(e, "courses")}
                  className="rounded-2xl bg-gradient-to-r from-slate-950 via-sky-900 to-teal-700 px-6 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(8,47,73,0.28)] transition hover:-translate-y-0.5 dark:from-teal-500 dark:via-teal-600 dark:to-cyan-500"
                >
                  Join Now
                </a>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Theme toggle (mobile) */}
            <button
              onClick={onToggleTheme}
              className="rounded-2xl border border-slate-200/80 bg-white/78 p-2.5 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Menu toggle */}
            <button
              className="rounded-2xl border border-slate-200/80 bg-white/78 p-2.5 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              title={isMobileMenuOpen ? "Close menu" : "Menu"}
            >
              {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="px-4 md:hidden">
          <div className="mx-auto mt-3 w-full max-w-[1360px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/96">
            {navItems.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
                className="block rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                {id.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </a>
            ))}

            <div className="border-t border-gray-100 pt-4 dark:border-slate-800" />

            {isStudentLoggedIn ? (
              <button
                onClick={() => {
                  onNavigate("student-dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-slate-950 via-sky-900 to-teal-700 py-4 font-black text-white shadow-[0_16px_30px_rgba(8,47,73,0.28)] transition dark:from-teal-500 dark:via-teal-600 dark:to-cyan-500"
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
                  className="mt-4 w-full rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-800 transition dark:bg-slate-900 dark:text-slate-100"
                >
                  Student Login
                </button>

                <a
                  href="#courses"
                  onClick={(e) => scrollToSection(e, "courses")}
                  className="mt-3 block w-full rounded-2xl bg-gradient-to-r from-slate-950 via-sky-900 to-teal-700 py-4 text-center font-black text-white shadow-[0_16px_30px_rgba(8,47,73,0.28)] transition dark:from-teal-500 dark:via-teal-600 dark:to-cyan-500"
                >
                  Join the Next Cohort
                </a>
              </>
            )}
          </div>
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
