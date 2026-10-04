import React from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import type { View } from "../src/App";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { Lockup, WhatsAppIcon } from "../src/marketing/ui";
import { useContactLinks } from "../src/marketing/useContactLinks";
import { trackWhatsApp } from "../src/marketing/analytics";

interface FooterProps {
  onNavigate: (view: View) => void;
  isAdminLoggedIn?: boolean;
}

const linkClass = "text-sm font-medium text-white/90 transition-colors hover:text-white hover:underline";

const Footer: React.FC<FooterProps> = ({ onNavigate, isAdminLoggedIn }) => {
  const { config } = useSiteConfig();
  const { whatsapp } = useContactLinks();
  const apk = config.apkDownloadUrl;

  const columns: { title: string; dot: string; links: { label: string; to?: string; href?: string; onClick?: () => void }[] }[] = [
    {
      title: "Learn",
      dot: "bg-teal-400",
      links: [
        { label: "Courses", to: "/courses" },
        { label: "Student login", onClick: () => onNavigate("student-login") },
        ...(apk ? [{ label: "Download the app", href: apk }] : []),
      ],
    },
    {
      title: "Hire",
      dot: "bg-orange-500",
      links: [
        { label: "Work", to: "/work" },
        { label: "Packages", to: "/hire#packages" },
        { label: "Start a project", to: "/hire#enquire" },
      ],
    },
    {
      title: "Company",
      dot: "bg-white",
      links: [
        { label: "About", to: "/#about" },
        { label: "Contact", to: "/contact" },
        { label: "Privacy", to: "/privacy" },
        { label: "Terms", to: "/terms" },
        { label: "Refund policy", to: "/refund" },
      ],
    },
  ];

  return (
    <footer className="bg-[#08152E] text-white">
      <div className="mx-auto w-full max-w-[1248px] px-5 pb-8 pt-12 sm:px-6 lg:pt-[72px]">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-20">
          <div className="max-w-sm space-y-4">
            <Link to="/" aria-label="CodeWithGideon home" className="inline-block">
              <Lockup onDark className="h-9" />
            </Link>
            <p className="text-base leading-[26px] text-slate-400">Live coding classes and websites for businesses, from Abuja.</p>
            <div className="flex flex-col items-start gap-3">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("footer")}
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-teal-300" />
                Chat on WhatsApp
              </a>
              <a
                href={`mailto:${config.contactEmail}`}
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                <Mail className="h-[18px] w-[18px]" aria-hidden />
                {config.contactEmail}
              </a>
            </div>
            <div className="flex gap-4 pt-1 text-sm text-slate-400">
              {config.instagramUrl ? (
                <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Instagram
                </a>
              ) : null}
              {config.tiktokUrl ? (
                <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  TikTok
                </a>
              ) : null}
            </div>
          </div>

          <nav aria-label="Footer" className="grid flex-1 grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:gap-x-16">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} aria-hidden />
                  {col.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className={linkClass}>
                          {l.label}
                        </Link>
                      ) : l.href ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {l.label}
                        </a>
                      ) : (
                        <button type="button" onClick={l.onClick} className={linkClass}>
                          {l.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-400">© {new Date().getFullYear()} CodeWithGideon · Abuja, Nigeria</p>
          <button
            type="button"
            onClick={() => onNavigate(isAdminLoggedIn ? "admin-dashboard" : "admin-login")}
            className="self-start text-slate-400 hover:text-white sm:self-auto"
          >
            Admin
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
