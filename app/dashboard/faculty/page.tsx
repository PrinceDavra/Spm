import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default async function FacultyDashboardPage() {
  const user = await requireRole([Role.FACULTY, Role.ADMIN]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Faculty Academic Station &bull; {user.designation || "Associate Professor"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user.firstName} {user.lastName}!
          </h1>
          <p className="mt-2 text-sm text-emerald-100/80 leading-relaxed">
            Department of {user.departmentName || "Computer Engineering"}.
            You are currently assigned to 2 divisions (Div A, Div B) across DBMS and Computer Networks.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Allocated */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Classes
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">2 Divisions</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            TE COMP-A &bull; TE COMP-B
          </div>
        </div>

        {/* Today's Teaching Periods */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today&apos;s Lectures
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">3 Lectures</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Next: 11:30 AM &bull; Room 302 (DBMS Theory)
          </div>
        </div>

        {/* Attendance Marking Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Attendance Today
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">1 Pending</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Pending sheet for Period 1
          </div>
        </div>

        {/* Submissions to Evaluate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Grading
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">18 Files</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Assignment 2 &bull; Computer Networks
          </div>
        </div>
      </div>
    </div>
  );
}
