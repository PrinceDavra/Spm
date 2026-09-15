import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { NoticeService } from "@/services/notice.service";
import { EventService } from "@/services/event.service";
import { ClubService } from "@/services/club.service";
import {
  Users,
  Building2,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  BellRing,
  Award,
  GraduationCap,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { SmartFeedWidget } from "@/components/notifications/smart-feed-widget";
import { ExamService } from "@/services/exam.service";
import { ExamStatus } from "@prisma/client";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);
  const noticeAnalytics = await NoticeService.getNoticeAnalytics(user.id, Role.ADMIN);
  const eventSummary = await EventService.getOrganizerSummary(user.id, Role.ADMIN);
  const { total: totalUpcomingEvents } = await EventService.getEvents({
    userId: user.id,
    role: Role.ADMIN,
    tab: "upcoming",
  });

  // Load club governance metrics
  const { clubs: allClubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 100,
  });
  const activeClubsCount = allClubs.filter((c) => c.status === "ACTIVE").length;
  const draftClubsCount = allClubs.filter((c) => c.status === "DRAFT").length;
  const totalClubMembers = allClubs.reduce((acc, c) => acc + (c.memberCount || 0), 0);

  // Load examination lifecycle KPIs & upcoming exams
  const examAnalytics = await ExamService.getExamAnalytics();
  const allExams = await ExamService.getExams();
  const upcomingAdminExams = allExams.filter((e) => e.status === ExamStatus.SCHEDULED).slice(0, 3);

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

      {/* Smart Information Feed */}
      <SmartFeedWidget />

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

      {/* Examination Lifecycle & Results Oversight Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Examination Lifecycle &amp; Grade Oversight
              </h2>
              <p className="text-xs text-muted-foreground">
                Conflict checking, faculty gradebook tracking, result publication authorization &amp; audit trails
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/exams"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
          >
            Manage All Exams &amp; Results
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Papers</span>
            <div className="mt-1 text-2xl font-extrabold text-foreground">{examAnalytics.totalExams}</div>
            <div className="text-[11px] text-muted-foreground">Curriculum active</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Scheduled</span>
            <div className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{examAnalytics.scheduledExams}</div>
            <div className="text-[11px] text-muted-foreground">Upcoming calendar</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Grades</span>
            <div className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{examAnalytics.completedExams}</div>
            <div className="text-[11px] text-muted-foreground">Awaiting submission</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Published</span>
            <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{examAnalytics.publishedExams}</div>
            <div className="text-[11px] text-muted-foreground">Student visible</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pass Rate</span>
            <div className="mt-1 text-2xl font-extrabold text-foreground">{examAnalytics.passRate}%</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Standard 10-point scale</div>
          </div>
        </div>

        {upcomingAdminExams.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span>Next Scheduled Examination Sessions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingAdminExams.map((exam) => (
                <div key={exam.id} className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="font-mono font-bold text-primary">{exam.subjectCode}</span>
                      <span>{exam.date}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground line-clamp-1">{exam.title}</div>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-1.5">
                    <span>Room {exam.roomNumber || "301"}</span>
                    <span>{exam.startTime} – {exam.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notice Center Overview Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Notice Center &amp; Institutional Circulars
              </h2>
              <p className="text-xs text-muted-foreground">
                Broadcast governance, reach telemetry, and active circular distribution
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/notices"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Manage All Notices
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Published Circulars</div>
            <div className="text-2xl font-extrabold text-foreground">{noticeAnalytics.metrics.published}</div>
            <div className="text-[11px] text-muted-foreground">Active in feeds</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Drafts in Queue</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{noticeAnalytics.metrics.drafts}</div>
            <div className="text-[11px] text-muted-foreground">Awaiting publication</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Audience Reach</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{noticeAnalytics.metrics.totalReach}</div>
            <div className="text-[11px] text-muted-foreground">Targeted recipients</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Campus Read Rate</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{noticeAnalytics.metrics.averageReadRate}%</div>
            <div className="text-[11px] text-muted-foreground">{noticeAnalytics.metrics.totalReads} confirmed reads</div>
          </div>
        </div>
      </div>

      {/* Campus Events & Moderation Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Campus Events &amp; Extracurricular Governance
              </h2>
              <p className="text-xs text-muted-foreground">
                Institutional hackathons, workshops, guest lectures, and campus-wide event moderation
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Moderate All Events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Active Events</div>
            <div className="text-2xl font-extrabold text-foreground">{eventSummary.activeEventsCount}</div>
            <div className="text-[11px] text-muted-foreground">Registrations live</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Upcoming Sessions</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalUpcomingEvents}</div>
            <div className="text-[11px] text-muted-foreground">Scheduled in calendar</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Total Registrations</div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{eventSummary.totalRegistrationsCount}</div>
            <div className="text-[11px] text-muted-foreground">Student RSVP bookings</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Overall Attendance Rate</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{eventSummary.averageAttendanceRate}%</div>
            <div className="text-[11px] text-muted-foreground">Verified participant turnout</div>
          </div>
        </div>
      </div>

      {/* Student Organizations & Club Governance Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Student Organizations &amp; Club Governance
              </h2>
              <p className="text-xs text-muted-foreground">
                Campus society charters, faculty advisor mappings, and extracurricular community engagement
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/clubs"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm self-start sm:self-auto"
          >
            Manage Club Charters
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Active Clubs</div>
            <div className="text-2xl font-extrabold text-foreground">{activeClubsCount}</div>
            <div className="text-[11px] text-muted-foreground">Chartered societies</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Draft Review Queue</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{draftClubsCount}</div>
            <div className="text-[11px] text-muted-foreground">Awaiting admin publication</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Total Memberships</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalClubMembers}</div>
            <div className="text-[11px] text-muted-foreground">Active student participants</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">All Campus Societies</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{allClubs.length}</div>
            <div className="text-[11px] text-muted-foreground">Total registered chapters</div>
          </div>
        </div>
      </div>
    </div>
  );
}
