"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Bell, Shield, User, Loader2 } from "lucide-react";
import { SessionUser } from "@/lib/auth/session";

export function DashboardHeader({
  user,
  onOpenMobile,
}: {
  user: SessionUser;
  onOpenMobile: () => void;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "CS";

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Workspace Title */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>CampusSphere</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white capitalize">
            {user.role.toLowerCase().replace("_", " ")} Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Security Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
          <Shield className="h-3 w-3" />
          <span>Server Verified: {user.role}</span>
        </div>

        {/* Notifications Icon (Visual placeholder ready for Phase 7) */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                {user.email}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
                <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 inline-block">
                  Role: {user.role}
                </div>
              </div>

              <div className="p-1 space-y-1">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>View Account Details</span>
                </button>

                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
