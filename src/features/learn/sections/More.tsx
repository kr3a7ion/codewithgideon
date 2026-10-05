import React from "react";
import { Link } from "react-router-dom";
import { Award, BookOpen, ChevronRight, CreditCard, Download, LogOut, Moon, Sun, Users, type LucideIcon } from "lucide-react";
import { WhatsAppIcon } from "../../../marketing/ui";
import { useContactLinks } from "../../../marketing/useContactLinks";
import { cn } from "../../../ui";
import { Avatar, Card, plural } from "../../shared/ui";
import { useStudent } from "../StudentDataContext";
import { StudentPageHeader } from "../StudentPageHeader";
import { studentSectionRoutes, type StudentSection } from "../lib";

const rowCls = "flex min-h-[60px] w-full items-center gap-3.5 px-4 py-2.5 text-left hover:bg-paper dark:hover:bg-slate-800";

const Tile: React.FC<{ icon?: LucideIcon; children?: React.ReactNode }> = ({ icon: Icon, children }) => (
  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-paper text-blue-900 dark:bg-slate-800 dark:text-white">
    {Icon ? <Icon className="h-[18px] w-[18px]" /> : children}
  </span>
);

/** More (/student/more): everything that isn't in the phone tab bar. */
const More: React.FC = () => {
  const s = useStudent();
  const { apk, whatsapp } = useContactLinks();
  const profile = s.profile!;
  const shortCourse = (s.courseTitle || profile.path || "").split(/[\s&]+/)[0];
  const earned = Math.min(s.paidWeeks, s.totalProgramWeeks);

  const links: { key: StudentSection; label: string; icon: LucideIcon; meta?: string }[] = [
    { key: "resources", label: "Resources", icon: BookOpen },
    { key: "community", label: "Community", icon: Users },
    { key: "badges", label: "Badges", icon: Award, meta: earned ? `${earned} earned` : undefined },
    { key: "account", label: "Payments & account", icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <StudentPageHeader title="More" compactOnPhone />

      <Link to={studentSectionRoutes.account} className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-4 hover:border-line-strong dark:border-line-dark dark:bg-slate-900">
        <Avatar name={profile.fullName} size={52} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold text-blue-900 dark:text-white">{profile.fullName || "Your profile"}</span>
          <span className="block truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {[shortCourse, s.paymentState === "active" ? `${s.paidWeeks} of ${plural(s.totalProgramWeeks, "week")}` : s.paymentState === "checking" ? "Checking payment" : "Payment pending"]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      </Link>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-line dark:divide-line-dark">
          {links.map((l) => (
            <li key={l.key}>
              <Link to={studentSectionRoutes[l.key]} className={rowCls}>
                <Tile icon={l.icon} />
                <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">{l.label}</span>
                {l.meta ? <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{l.meta}</span> : null}
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
          {apk ? (
            <li>
              <a href={apk} className={rowCls}>
                <Tile icon={Download} />
                <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">Get the Android app</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </a>
            </li>
          ) : null}
          {whatsapp ? (
            <li>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={rowCls}>
                <Tile>
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                </Tile>
                <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">Help on WhatsApp</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </a>
            </li>
          ) : null}
          {s.onToggleTheme ? (
            <li>
              <button type="button" role="switch" aria-checked={!!s.isDark} onClick={s.onToggleTheme} className={rowCls}>
                <Tile icon={s.isDark ? Moon : Sun} />
                <span className="flex-1 text-[15px] font-bold text-blue-900 dark:text-white">Dark mode</span>
                <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", s.isDark ? "bg-teal-600" : "bg-line-strong")} aria-hidden>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]", s.isDark ? "left-[22px]" : "left-0.5")} />
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      </Card>

      <button
        type="button"
        onClick={s.logout}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line-strong bg-white text-[15px] font-bold text-blue-900 hover:border-blue-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
      >
        <LogOut className="h-5 w-5" aria-hidden /> Sign out
      </button>
      <p className="text-center text-[13px] font-medium text-slate-500 dark:text-slate-400">CodeWithGideon</p>
    </div>
  );
};

export default More;
