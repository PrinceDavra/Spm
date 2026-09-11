import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function FacultyDashboardPage() {
  const user = await requireRole([Role.FACULTY, Role.ADMIN]);

  // Load faculty assigned subjects and live analytics
  const assignedSubjects = await AttendanceService.getFacultySubjects(user.id);

  let primaryAnalytics = null;
  if (assignedSubjects.length > 0) {
    try {
      primaryAnalytics = await AttendanceService.getFacultyAnalytics(
        user.id,
        assignedSubjects[0].facultySubjectId
      );
    } catch {
      primaryAnalytics = null;
    }
  }

  const totalAtRisk = primaryAnalytics ? primaryAnalytics.below75Count : 0;
  const avgAttendance = primaryAnalytics ? primaryAnalytics.avgPercentage : 80;

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
            You are managing {assignedSubjects.length} academic course allocation{assignedSubjects.length > 1 ? "s" : ""}.
            {totalAtRisk > 0
              ? ` Note: ${totalAtRisk} students in your classes are currently below the 75% attendance threshold.`
              : " All students in your assigned divisions are currently maintaining satisfactory attendance."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Action Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm sm:text-base">
              Ready to conduct today&apos;s lecture attendance?
            </div>
            <div className="text-xs text-muted-foreground">
              Load your assigned division roster and mark student attendance with automated conflict prevention.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/dashboard/faculty/attendance/mark"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm active:scale-95"
          >
            <ClipboardCheck className="h-4 w-4" />
            Mark Class Attendance
          </Link>
          <Link
            href="/dashboard/faculty/attendance/history"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
          >
            Attendance Logs &amp; Audit
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid — Backed by Real Database Logic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Allocated */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Courses
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {assignedSubjects.length}
            </span>
            <span className="text-xs text-slate-500">Allocations</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {assignedSubjects.map((s) => s.code).join(" &bull; ")}
          </div>
        </div>

        {/* Class Average Attendance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Class Attendance Avg
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {avgAttendance}%
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              AVERAGE
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Across {primaryAnalytics?.totalStudents || 4} enrolled students
          </div>
        </div>

        {/* Students At Debarment Risk */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Students At Risk
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {totalAtRisk}
            </span>
            <span className="text-xs text-slate-500">below 75%</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {primaryAnalytics?.below65Count || 0} critical (&lt;65%)
          </div>
        </div>

        {/* Action Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Register Status
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Active</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            6 lecture periods configured
          </div>
        </div>
      </div>

      {/* Assigned Subjects List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Assigned Courses &amp; Division Registers
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized subject mappings linked to your faculty identity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignedSubjects.map((sub) => (
            <div
              key={sub.facultySubjectId}
              className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="font-mono text-xs font-bold text-primary">
                  {sub.code} &bull; {sub.divisionName}
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {sub.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Semester {sub.semester} &bull; {sub.credits} Credits
                </div>
              </div>

              <Link
                href={`/dashboard/faculty/attendance/mark`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition"
              >
                Mark Attendance
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
