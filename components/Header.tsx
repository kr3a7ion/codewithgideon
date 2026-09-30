import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import type { View } from "../src/App";
import { cn } from "../src/ui";
import { Lockup, mbtn } from "../src/marketing/ui";
import { bookCallHref, BOOKING_URL } from "../src/marketing/content";
import { trackCta, trackWhatsApp } from "../src/marketing/analytics";

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isStudentLoggedIn?: boolean;
}

type Item = { label: string; to: string; caption: string; dot: string; underline: string; match: (path: string, hash: string) => boolean };

const NAV: Item[] = [
  { label: "Learn", to: "/courses", caption: "Live cohort classes", dot: "bg-teal-500", underline: "bg-teal-500", match: (p) => p.startsWith("/courses") },
  { label: "Work", to: "/work", caption: "Sample projects and case studies", dot: "bg-blue-900 dark:bg-white", underline: "bg-blue-900 dark:bg-white", match: (p) => p.startsWith("/work") },
  { label: "Hire", to: "/hire", caption: "A website for your business", dot: "bg-orange-500", underline: "bg-orange-500", match: (p) => p.startsWith("/hire") },
  { label: "About", to: "/#about", caption: "Who Gideon is", dot: "bg-blue-900 dark:bg-white", underline: "bg-blue-900 dark:bg-white", match: (p, h) => p === "/" && h === "#about" },
];

const Header: React.FC<HeaderProps> = ({ onNavigate, isDark, onToggleTheme, isStudentLoggedIn = false }) => {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation and on resize to desktop.
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock page scroll, close on Escape, and keep focus inside the open menu.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const callHref = bookCallHref();
  const onCall = (where: "nav" | "menu") => {
    trackCta("book_call", where);
    if (!BOOKING_URL) trackWhatsApp(where);
  };
  const account = isStudentLoggedIn
    ? { label: "My dashboard", go: () => onNavigate("student-dashboard") }
    : { label: "Log in", go: () => onNavigate("student-login") };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur transition-colors supports-[backdrop-filter]:bg-white/85 dark:bg-slate-950/90",
        scrolled || open ? "border-line dark:border-line-dark" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1248px] items-center justify-between gap-4 px-5 sm:px-6 lg:h-[76px]">
        <Link to="/" aria-label="Code with Gideon home" className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <Lockup markClassName="h-8 w-8 lg:h-9 lg:w-9" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {NAV.map((item) => {
              const active = item.match(pathname, hash);
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={() => {
                      if (item.to === "/#about" && pathname === "/" && hash === "#about") document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 pt-2 text-[15px] font-semibold transition-colors",
                      active ? "text-blue-900 dark:text-white" : "text-slate-600 hover:text-blue-900 dark:text-slate-300 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                    <span className={cn("h-0.5 w-5 rounded-full transition-opacity", item.underline, active ? "opacity-100" : "opacity-0 group-hover:opacity-40")} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={account.go}
            className="hidden rounded-lg px-2 py-2 text-[15px] font-semibold text-blue-900 hover:underline dark:text-white lg:block"
          >
            {account.label}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-blue-900 transition hover:bg-paper dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 sm:flex"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
          </button>
          <a
            href={callHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onCall("nav")}
            className={mbtn({ kind: "primary", size: "sm", className: "hidden sm:inline-flex" })}
          >
            Book a call
          </a>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong text-blue-900 dark:border-slate-700 dark:text-white lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          ref={panel}
          className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-line bg-white dark:border-line-dark dark:bg-slate-950 lg:hidden"
        >
          <nav aria-label="Main" className="mx-auto w-full max-w-[1248px] px-5 pt-2 sm:px-6">
            <ul>
              {NAV.map((item) => (
                <li key={item.label} className="border-b border-line dark:border-line-dark">
                  <Link to={item.to} className="flex items-center gap-3.5 py-4">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.dot)} aria-hidden />
                    <span className="flex-1">
                      <span className="block font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{item.label}</span>
                      <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">{item.caption}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mx-auto grid w-full max-w-[1248px] gap-3 px-5 pb-7 pt-6 sm:px-6">
            <a href={callHref} target="_blank" rel="noopener noreferrer" onClick={() => onCall("menu")} className={mbtn({ kind: "primary", size: "lg", full: true })}>
              Book a call
            </a>
            <button type="button" onClick={account.go} className={mbtn({ kind: "secondary", size: "lg", full: true })}>
              {account.label}
            </button>
            <button type="button" onClick={onToggleTheme} className="mt-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
