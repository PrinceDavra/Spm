import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import {
  Users,
  Building2,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg shadow-purple-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Institutional Governance Command &bull; Master Privilege</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Center &bull; {user.firstName} {user.lastName}
          </h1>
          <p className="mt-2 text-sm text-purple-100/80 leading-relaxed">
            Full authority over User provisioning, Academic division hierarchy, CSP Timetable engine,
            Attendance audits, Campus-wide notices, and System Audit Trails.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Institutional Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Enrolled Students
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">1,420</span>
            <span className="text-xs text-emerald-600 font-semibold">+4.2%</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Across 5 Academic Departments
          </div>
        </div>

        {/* Total Faculty */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Faculty & Staff
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">86</span>
            <span className="text-xs text-slate-500">Members</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            100% Assigned to Subject Rosters
          </div>
        </div>

        {/* Timetable Engine */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Timetable Engine
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">v1 Active</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                0 Conflicts
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              17 Sessions &bull; 94% Soft Score
            </div>
          </div>
          <Link
            href="/dashboard/admin/timetable"
            className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Launch CSP Generator
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* System Security */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              RBAC Security
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Strict Mode</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Edge Guard &bull; Server Token Verified
          </div>
        </div>
      </div>
    </div>
  );
}
