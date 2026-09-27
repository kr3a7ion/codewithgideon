/* Admin frame: sidebar on desktop, top bar + bottom tabs on phones. */
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Info,
  LogOut,
  Menu as MenuIcon,
  Moon,
  RefreshCw,
  Sun,
  X,
} from "lucide-react";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { useAdminInsights } from "../insights";
import { ADMIN_NAV, NAV_GROUPS, pageFromPath, type AdminPageKey } from "../nav";
import { formatSessionCountdown } from "../lib";
import { Dialog, IconButton } from "../ui";

type Props = {
  children: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

const Brand: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2.5">
    <span
      aria-hidden
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-900 font-display text-base font-bold text-white"
    >
      G
    </span>
    {compact ? null : (
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-blue-900 dark:text-white">Code with Gideon</span>
        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Admin</span>
      </span>
    )}
  </div>
);

const CountBadge: React.FC<{ count?: number; active?: boolean }> = ({ count, active }) =>
  count ? (
    <span
      className={cn(
        "ml-auto min-w-[1.35rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold",
        active ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950" : "bg-orange-500 text-white",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const LockTimer: React.FC<{ ms: number }> = ({ ms }) =>
  ms > 0 ? (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums",
        ms < 5 * 60_000
          ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
          : "text-slate-500 dark:text-slate-400",
      )}
      title="For security, the admin area locks after 30 minutes. Any activity resets it."
    >
      <Clock3 className="h-3.5 w-3.5" aria-hidden />
      Locks in {formatSessionCountdown(ms)}
    </span>
  ) : null;

const Toast: React.FC = () => {
  const { adminNotice, setAdminNotice } = useAdmin();
  useEffect(() => {
    if (!adminNotice) return;
    const t = window.setTimeout(() => setAdminNotice(null), adminNotice.tone === "error" ? 9000 : 5000);
    return () => window.clearTimeout(t);
  }, [adminNotice, setAdminNotice]);
  if (!adminNotice) return null;
  const Icon = adminNotice.tone === "success" ? CheckCircle2 : adminNotice.tone === "error" ? AlertTriangle : Info;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[95] flex justify-center px-4 lg:bottom-6 lg:justify-end lg:pr-6">
      <div
        role={adminNotice.tone === "error" ? "alert" : "status"}
        className={cn(
          "pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl",
          adminNotice.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-100",
          adminNotice.tone === "error" && "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950 dark:text-red-100",
          adminNotice.tone === "info" && "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="flex-1">{adminNotice.message}</p>
        <button type="button" onClick={() => setAdminNotice(null)} aria-label="Dismiss" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};

const ConfirmHost: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useAdmin();
  return (
    <Dialog
      open={!!confirmDialog}
      onClose={() => closeConfirmDialog(false)}
      title={confirmDialog?.title || ""}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => closeConfirmDialog(false)}>
            {confirmDialog?.cancelLabel || "Cancel"}
          </Button>
          <Button
            variant={confirmDialog?.tone === "danger" ? "danger" : "primary"}
            onClick={() => closeConfirmDialog(true)}
            data-autofocus
          >
            {confirmDialog?.confirmLabel || "Confirm"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{confirmDialog?.message}</p>
    </Dialog>
  );
};

export const AdminLayout: React.FC<Props> = ({ children, isDark, onToggleTheme }) => {
  const { onLogout, onNavigate, sessionRemainingMs, busy, handleRefreshAll } = useAdmin();
  const insights = useAdminInsights();
  const location = useLocation();
  const current = pageFromPath(location.pathname);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [location.pathname]);

  const counts = useMemo<Partial<Record<AdminPageKey, number>>>(
    () => ({
      today: insights.todayAttention,
      payments: insights.paymentsAttention,
      inbox: insights.inboxAttention,
      classes: insights.missingRecordings.length,
      cohorts: insights.intakesWithoutClasses.length + insights.pathsWithoutIntake.length,
    }),
    [insights],
  );

  const refresh = (
    <IconButton label="Refresh data" onClick={handleRefreshAll} busy={!!busy.refreshAll}>
      <RefreshCw className="h-4 w-4" aria-hidden />
    </IconButton>
  );
  const themeButton = onToggleTheme ? (
    <IconButton label={isDark ? "Light mode" : "Dark mode"} onClick={onToggleTheme}>
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </IconButton>
  ) : null;

  const tabItems = ADMIN_NAV.filter((i) => i.tab);
  const moreItems = ADMIN_NAV.filter((i) => !i.tab);
  const moreCount = moreItems.reduce((sum, i) => sum + (counts[i.key] || 0), 0);
  const moreActive = !!current && !current.tab;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => {
            const items = ADMIN_NAV.filter((i) => i.group === group);
            return (
              <div key={group} className="mb-4">
                {group !== "Overview" ? (
                  <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
                ) : null}
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.key}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                            isActive
                              ? "bg-blue-900 text-white dark:bg-teal-500 dark:text-slate-950"
                              : "text-slate-600 hover:bg-slate-100 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{item.label}</span>
                            <CountBadge count={counts[item.key]} active={isActive} />
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
          <div className="px-2 pb-1">
            <LockTimer ms={sessionRemainingMs} />
          </div>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> View website
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <Brand compact />
              <span className="truncate font-display text-base font-bold text-blue-900 dark:text-white">
                {current?.label || "Admin"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="hidden sm:inline-flex">
                <LockTimer ms={sessionRemainingMs} />
              </span>
              {themeButton}
              {refresh}
            </div>
          </div>
        </header>

        <main id="admin-main">{children}</main>
      </div>

      {/* Phone bottom tabs */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                    isActive ? "text-blue-900 dark:text-teal-400" : "text-slate-500 dark:text-slate-400",
                  )
                }
              >
                <span className="relative">
                  <item.icon className="h-5 w-5" aria-hidden />
                  {counts[item.key] ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[1.1rem] rounded-full bg-orange-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {counts[item.key]! > 9 ? "9+" : counts[item.key]}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                moreActive ? "text-blue-900 dark:text-teal-400" : "text-slate-500 dark:text-slate-400",
              )}
            >
              <span className="relative">
                <MenuIcon className="h-5 w-5" aria-hidden />
                {moreCount ? (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[1.1rem] rounded-full bg-orange-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {moreCount > 9 ? "9+" : moreCount}
                  </span>
                ) : null}
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <div className="space-y-4">
          {NAV_GROUPS.filter((g) => moreItems.some((i) => i.group === g)).map((group) => (
            <div key={group}>
              <p className="pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
              <ul className="grid gap-2">
                {moreItems
                  .filter((i) => i.group === group)
                  .map((item) => (
                    <li key={item.key}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-semibold",
                            isActive
                              ? "border-blue-900 bg-blue-900 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950"
                              : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{item.label}</span>
                            <CountBadge count={counts[item.key]} active={isActive} />
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div className="grid gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <LockTimer ms={sessionRemainingMs} />
            <Button variant="secondary" onClick={() => onNavigate("home")} leftIcon={<ExternalLink className="h-4 w-4" />}>
              View website
            </Button>
            <Button variant="secondary" onClick={onLogout} leftIcon={<LogOut className="h-4 w-4" />}>
              Log out
            </Button>
          </div>
        </div>
      </Dialog>

      <Toast />
      <ConfirmHost />
    </div>
  );
};

export default AdminLayout;
