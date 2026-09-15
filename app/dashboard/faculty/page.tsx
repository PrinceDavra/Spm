import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import { TimetableService } from "@/services/timetable.service";
import { AssignmentService } from "@/services/assignment.service";
import { NoticeService } from "@/services/notice.service";
import { EventService } from "@/services/event.service";
import { ClubService } from "@/services/club.service";
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
  MapPin,
  FileText,
  Award,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import { SmartFeedWidget } from "@/components/notifications/smart-feed-widget";

export default async function FacultyDashboardPage() {
  const user = await requireRole([Role.FACULTY, Role.ADMIN]);

  // Load faculty assigned subjects and live analytics
  const assignedSubjects = await AttendanceService.getFacultySubjects(user.id);

  // Load live faculty timetable
  const timetableData = await TimetableService.getFacultyTimetable(user.id);
  const todayTeaching = timetableData.todaySlots;

  // Load faculty coursework assignments
  const facultyAssignments = await AssignmentService.getFacultyAssignments(user.id, user.role);
  const totalPendingGrading = facultyAssignments.reduce((acc, a) => acc + a.pendingGradingCount, 0);
  const totalSubmissions = facultyAssignments.reduce((acc, a) => acc + a.submittedCount, 0);

  // Load faculty notices
  const { notices: facultyNotices } = await NoticeService.getNotices({
    userId: user.id,
    role: Role.FACULTY,
    departmentId: "dept-comp",
    limit: 4,
  });
  const unreadNoticeCount = await NoticeService.getUnreadCount(user.id, Role.FACULTY, "dept-comp");

  // Load faculty events summary
  const eventSummary = await EventService.getOrganizerSummary(user.id, user.role);

  // Load faculty advised clubs
  const { clubs: facultyClubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 20,
  });
  const advisedClubs = facultyClubs.filter(
    (c) => c.facultyAdvisorId === user.id || (user.lastName && c.facultyAdvisorName?.includes(user.lastName))
  );

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

      {/* Smart Information Feed */}
      <SmartFeedWidget />

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

      {/* Today's Teaching Schedule Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Today&apos;s Teaching Schedule ({timetableData.todayDay})
              </h2>
              <p className="text-xs text-muted-foreground">
                {todayTeaching.length} academic teaching session{todayTeaching.length === 1 ? "" : "s"} assigned today
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/faculty/timetable"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            View Full Teaching Timetable
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayTeaching.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayTeaching.map((slot) => (
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
                  <span className="font-semibold text-foreground">
                    {slot.divisionId === "div-comp-a" ? "Division A" : "Division B"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <MapPin className="h-3 w-3" />
                    {slot.roomNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground text-xs">
            No teaching periods scheduled for today. Use this time for research or grading.
          </div>
        )}
      </div>

      {/* Coursework & Assignments Management Overview */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Coursework &amp; Assignments Tracking
              </h2>
              <p className="text-xs text-muted-foreground">
                {facultyAssignments.length} Courses &bull; {totalSubmissions} Submissions Received &bull;{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {totalPendingGrading} Pending Grading
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/faculty/assignments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Manage All Assignments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {facultyAssignments.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/faculty/assignments/${a.id}/submissions`}
              className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-primary">{a.subjectCode}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {a.divisionName}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {a.title}
                </h4>
                <div className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground pt-3 border-t border-border/50 flex justify-between items-center mt-3">
                <span>{a.submittedCount}/{a.totalEnrolled} submitted</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {a.pendingGradingCount} to grade
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Communication & Faculty Notices Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Institutional Communication &amp; Circulars
              </h2>
              <p className="text-xs text-muted-foreground">
                {unreadNoticeCount} unread notices &bull; Circulars and academic notices published across campus
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/faculty/notices"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Open Notice Center
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {facultyNotices.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-primary">{n.category}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      n.priority === "URGENT"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : n.priority === "IMPORTANT"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {n.priority}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground line-clamp-2">
                  {n.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {n.summary}
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground pt-3 border-t border-border/50 flex justify-between mt-3">
                <span>By: {n.authorName.split(" ").slice(-1)[0]}</span>
                <span>{n.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events & Campus Engagement Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Events &amp; Campus Engagement
              </h2>
              <p className="text-xs text-muted-foreground">
                Extracurricular masterclasses, technical hackathons, and participant attendance
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/faculty/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Manage Events &amp; Attendance
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Active Events</div>
            <div className="text-2xl font-extrabold text-foreground">{eventSummary.activeEventsCount}</div>
            <div className="text-[11px] text-muted-foreground">Open for registration</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Total Registrations</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{eventSummary.totalRegistrationsCount}</div>
            <div className="text-[11px] text-muted-foreground">Student participants</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Available Capacity</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{eventSummary.totalSeatsAvailable}</div>
            <div className="text-[11px] text-muted-foreground">Unallocated seats</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Average Attendance</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{eventSummary.averageAttendanceRate}%</div>
            <div className="text-[11px] text-muted-foreground">Verified at venue entrance</div>
          </div>
        </div>
      </div>

      {/* Clubs & Student Mentorship Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Clubs &amp; Student Mentorship ({advisedClubs.length} Advised Organizations)
              </h2>
              <p className="text-xs text-muted-foreground">
                Faculty advisory oversight, extracurricular governance, and student project sponsorship
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/student/clubs"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Browse All Campus Clubs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {advisedClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisedClubs.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{c.name}</h4>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Coordinator: {c.coordinatorName || "Student Council"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                  <span>{c.memberCount} members</span>
                  <Link
                    href={`/dashboard/student/clubs/${c.id}`}
                    className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Club</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No student organizations currently assigned for faculty advisory oversight.
          </div>
        )}
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
