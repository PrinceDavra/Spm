import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import { TimetableService } from "@/services/timetable.service";
import { AssignmentService } from "@/services/assignment.service";
import {
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  // Fetch real database-backed attendance summary & history
  const summary = await AttendanceService.getStudentSummary(user.id);
  const recentHistory = await AttendanceService.getStudentHistory(user.id);

  // Fetch live timetable data
  const timetableData = await TimetableService.getStudentTimetable(user.id);
  const todayLectures = timetableData.todaySlots;
  const nextLecture = todayLectures[0];

  // Fetch live assignments data
  const assignmentsData = await AssignmentService.getStudentAssignments(user.id);
  const pendingAssignments = assignmentsData.assignments
    .filter((a) => a.submissionStatus === "NOT_SUBMITTED" || a.submissionStatus === "OVERDUE")
    .slice(0, 3);

  // Lowest attendance subject
  const sortedSubjects = [...summary.subjectBreakdown].sort(
    (a, b) => a.percentage - b.percentage
  );
  const lowestSubject = sortedSubjects[0];

  // Most recent session
  const latestSession = recentHistory[0];

  const riskBadgeClass =
    summary.overallRisk === "SAFE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
      : summary.overallRisk === "WARNING"
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";

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
            {summary.overallRisk === "CRITICAL"
              ? " Attention: Your attendance is currently below the 65% critical debarment threshold. Review your projection immediately."
              : summary.overallRisk === "WARNING"
              ? " Heads up: Your overall attendance is in the warning band (65%–75%). Maintain regular attendance to avoid semester debarment."
              : " Excellent consistency! Your attendance meets institutional guidelines with a safe margin."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid — Backed by Real Database Logic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Live Attendance Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Attendance
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary.overallPercentage}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskBadgeClass}`}
              >
                {summary.overallRisk}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {summary.overallRisk === "SAFE"
                ? `Margin: Can miss up to ${summary.projection.classesCanMissWhileSafe} class${summary.projection.classesCanMissWhileSafe === 1 ? "" : "es"}`
                : `Action: Attend next ${summary.projection.classesNeededToReachTarget} class${summary.projection.classesNeededToReachTarget === 1 ? "" : "es"} to reach 75%`}
            </div>
          </div>
          <Link
            href="/dashboard/student/attendance"
            className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Detailed Projection Engine
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Lowest Attendance Subject Alert Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lowest Subject
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            {lowestSubject ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {lowestSubject.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                    {lowestSubject.subjectCode}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {lowestSubject.subjectName} ({lowestSubject.present}/{lowestSubject.conducted})
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">No subjects enrolled</div>
            )}
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            {lowestSubject && lowestSubject.percentage < 75 ? "Needs attendance focus" : "All subjects above 75%"}
          </div>
        </div>

        {/* Recent Attendance Session Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Latest Class Record
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            {latestSession ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {latestSession.subjectCode}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      latestSession.status === "PRESENT"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {latestSession.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {latestSession.date} &bull; Period {latestSession.periodNumber}
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">No recorded sessions</div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Recorded by {latestSession?.facultyName || "Faculty"}
          </div>
        </div>

        {/* Conducted Classes Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Semester Total
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary.overallPresent}
              </span>
              <span className="text-xs text-slate-500">/ {summary.overallConducted} lectures</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {summary.overallAbsent} missed lectures
            </div>
          </div>
          <Link
            href="/dashboard/student/attendance"
            className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Open Attendance Calendar
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Live Timetable Today's Schedule Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Today&apos;s Academic Schedule ({timetableData.todayDay})
              </h2>
              <p className="text-xs text-muted-foreground">
                Division A &bull; {todayLectures.length} lecture/lab sessions scheduled today
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/student/timetable"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            View Full Weekly Timetable
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayLectures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayLectures.map((slot) => (
              <div
                key={slot.variableId}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  slot.isLabSession
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-muted/40 border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                    <span>Period {slot.periodNumber}</span>
                    <span className="font-mono">{slot.startTime} – {slot.endTime}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-primary">
                    {slot.subjectCode}
                  </div>
                  <div className="text-sm font-bold text-foreground line-clamp-1 mt-0.5">
                    {slot.subjectName}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2 mt-3">
                  <span className="truncate max-w-[120px]">Prof. {slot.facultyName.split(" ").slice(-1)[0]}</span>
                  <span className="font-semibold text-foreground">{slot.roomNumber}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground text-xs">
            No lectures scheduled for today.
          </div>
        )}
      </div>

      {/* Assignment Overview Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Coursework &amp; Assignments
              </h2>
              <p className="text-xs text-muted-foreground">
                {assignmentsData.kpi.pending} Pending &bull; {assignmentsData.kpi.dueSoon} Due Soon &bull; {assignmentsData.kpi.submitted} Submitted
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/student/assignments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            View All Assignments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingAssignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pendingAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/student/assignments/${a.id}`}
                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-primary">{a.subjectCode}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.isOverdue
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : a.isUrgent
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {a.urgencyText}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {a.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {a.description}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground pt-3 border-t border-border/50 flex justify-between mt-3">
                  <span>Prof. {a.facultyName.split(" ").slice(-1)[0]}</span>
                  <span className="font-semibold text-foreground">{a.maxMarks} Marks</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground text-xs">
            You&apos;re all caught up! No pending coursework deadlines.
          </div>
        )}
      </div>

      {/* Subject-Wise Attendance Overview & Quick Link */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Current Subject Attendance Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live semester status computed from institutional PostgreSQL attendance archives.
            </p>
          </div>
          <Link
            href="/dashboard/student/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
          >
            Launch Attendance &amp; Projection Engine
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.subjectBreakdown.map((subj) => (
            <div
              key={subj.subjectCode}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">
                  {subj.subjectCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    subj.risk === "SAFE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      : subj.risk === "WARNING"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  {subj.percentage}%
                </span>
              </div>
              <div className="text-xs font-semibold text-foreground truncate">
                {subj.subjectName}
              </div>
              <div className="text-[11px] text-muted-foreground flex justify-between">
                <span>{subj.present}/{subj.conducted} attended</span>
                <span>{subj.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
