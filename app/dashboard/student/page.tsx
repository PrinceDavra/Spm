import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import {
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Student Academic Workspace &bull; {user.rollNumber || "22COMPA101"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.firstName}!
          </h1>
          <p className="mt-2 text-sm text-indigo-100/80 leading-relaxed">
            Semester 6 &bull; {user.departmentName || "Computer Engineering"} (Division A).
            You have 4 lectures scheduled today and 2 upcoming assignment deadlines.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall Attendance
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">82%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              SAFE
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Target: 75% &bull; Margin: 3 missable classes
          </div>
        </div>

        {/* Timetable Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today&apos;s Lectures
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">4 Periods</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Next: DBMS Lab at 10:30 AM (Lab-A)
          </div>
        </div>

        {/* Assignments Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assignments
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">2 Pending</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Due in 48 hours: Computer Networks Lab 4
          </div>
        </div>

        {/* Placement Preparation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Placement Prep
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">78%</span>
            <span className="text-xs text-slate-500">Readiness</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            14 mock tests completed
          </div>
        </div>
      </div>

      {/* Quick Navigation / Next Modules Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Upcoming Modules in Roadmap
          </h2>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            Phase 2 Authenticated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 3 &bull; Profile Management</div>
            <p className="text-xs text-slate-500 mt-1">
              Roll number verification, PRN record, and editable student skills.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 4 &bull; Attendance Engine</div>
            <p className="text-xs text-slate-500 mt-1">
              Live mathematical projection calculating classes required or bunk margins.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 5 &bull; Timetable Solver</div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic CSP engine for division schedules and room allocations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
