"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Users,
  Search,
  User,
  ClipboardList,
  History,
  FileSpreadsheet,
  Building2,
  Layers,
  BookOpen,
  Sliders,
  BellRing,
  Award,
  ShieldCheck,
  Building,
  FileCheck,
  Megaphone,
  Inbox,
  Sparkles,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleNavItems: Record<Role, NavItem[]> = {
  STUDENT: [
    { name: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
    { name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing },
    { name: "Academic Analytics", href: "/dashboard/student/analytics", icon: Activity },
    { name: "Exam Results", href: "/dashboard/results", icon: Award },
    { name: "Academic Transcript", href: "/dashboard/transcript", icon: GraduationCap },
    { name: "Attendance & Risk", href: "/dashboard/student/attendance", icon: TrendingUp },
    { name: "Weekly Timetable", href: "/dashboard/student/timetable", icon: CalendarDays },
    { name: "Assignments", href: "/dashboard/student/assignments", icon: CheckCircle2 },
    { name: "Notices & Circulars", href: "/dashboard/student/notices", icon: Megaphone },
    { name: "Campus Events", href: "/dashboard/student/events", icon: Award },
    { name: "Campus Clubs", href: "/dashboard/student/clubs", icon: Users },
    { name: "My Clubs", href: "/dashboard/student/clubs/my-clubs", icon: ShieldCheck },
    { name: "Placement Hub", href: "/dashboard/student/placements", icon: Briefcase },
    { name: "My Applications", href: "/dashboard/student/placements/applications", icon: FileCheck },
    { name: "Placement Prep & Quizzes", href: "/dashboard/student/placements/preparation", icon: BookOpen },
    { name: "Lost & Found Board", href: "/dashboard/student/lost-found", icon: Search },
    { name: "My Lost & Found Reports", href: "/dashboard/student/lost-found/my-reports", icon: Inbox },
    { name: "My Profile", href: "/dashboard/student/profile", icon: User },
  ],
  FACULTY: [
    { name: "Overview", href: "/dashboard/faculty", icon: LayoutDashboard },
    { name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing },
    { name: "Teaching Analytics", href: "/dashboard/faculty/analytics", icon: TrendingUp },
    { name: "Exam Gradebook", href: "/dashboard/faculty/exams", icon: FileCheck },
    { name: "Mark Attendance", href: "/dashboard/faculty/attendance/mark", icon: ClipboardList },
    { name: "Attendance Logs", href: "/dashboard/faculty/attendance/history", icon: History },
    { name: "Teaching Schedule", href: "/dashboard/faculty/timetable", icon: CalendarDays },
    { name: "Assignments & Grading", href: "/dashboard/faculty/assignments", icon: CheckCircle2 },
    { name: "My Classes & Rosters", href: "/dashboard/faculty/classes", icon: Users },
    { name: "Post Notice", href: "/dashboard/faculty/notices", icon: Megaphone },
    { name: "Campus Events", href: "/dashboard/faculty/events", icon: Award },
    { name: "Campus Clubs", href: "/dashboard/student/clubs", icon: Users },
    { name: "Lost & Found Board", href: "/dashboard/student/lost-found", icon: Search },
    { name: "Faculty Profile", href: "/dashboard/faculty/profile", icon: User },
  ],
  ADMIN: [
    { name: "Master Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing },
    { name: "Analytics & Intelligence", href: "/dashboard/admin/analytics", icon: TrendingUp },
    { name: "Exam Management", href: "/dashboard/admin/exams", icon: CalendarDays },
    { name: "Academic Setup", href: "/dashboard/admin/academic", icon: Sparkles },
    { name: "Departments", href: "/dashboard/admin/departments", icon: Building2 },
    { name: "Programs & Batches", href: "/dashboard/admin/programs", icon: GraduationCap },
    { name: "Classes & Divisions", href: "/dashboard/admin/classes", icon: Layers },
    { name: "Subjects & Syllabus", href: "/dashboard/admin/subjects", icon: BookOpen },
    { name: "Faculty Allocation", href: "/dashboard/admin/faculty-mapping", icon: Sliders },
    { name: "Rooms & Labs", href: "/dashboard/admin/rooms", icon: Building },
    { name: "Configuration Health", href: "/dashboard/admin/configuration-health", icon: Activity },
    { name: "Timetable Generator", href: "/dashboard/admin/timetable", icon: CalendarDays },
    { name: "Attendance Audit", href: "/dashboard/admin/attendance", icon: TrendingUp },
    { name: "Campus Notices", href: "/dashboard/admin/notices", icon: BellRing },
    { name: "Event Moderation", href: "/dashboard/admin/events", icon: Award },
    { name: "Club Governance", href: "/dashboard/admin/clubs", icon: Users },
    { name: "Placement Overseer", href: "/dashboard/admin/placements", icon: Briefcase },
    { name: "Lost & Found Moderation", href: "/dashboard/admin/lost-found", icon: Search },
    { name: "Claim Verification Desk", href: "/dashboard/admin/lost-found/claims", icon: FileCheck },
    { name: "Audit Trail Logs", href: "/dashboard/admin/audit-logs", icon: ShieldCheck },
  ],
  PLACEMENT_OFFICER: [
    { name: "Placement Cell", href: "/dashboard/placement", icon: LayoutDashboard },
    { name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing },
    { name: "Recruiting Partners", href: "/dashboard/placement/companies", icon: Building2 },
    { name: "Placement Drives", href: "/dashboard/placement/drives", icon: Briefcase },
    { name: "Campus Events", href: "/dashboard/placement/events", icon: Award },
    { name: "Student Applicants", href: "/dashboard/placement/applications", icon: FileCheck },
    { name: "Placement Analytics", href: "/dashboard/placement/analytics", icon: TrendingUp },
  ],
  CLUB_COORDINATOR: [
    { name: "Station Overview", href: "/dashboard/club", icon: LayoutDashboard },
    { name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing },
    { name: "Club Analytics", href: "/dashboard/club/analytics", icon: TrendingUp },
    { name: "Membership Roster", href: "/dashboard/club/members", icon: CheckCircle2 },
    { name: "Club Activities", href: "/dashboard/club/activities", icon: CalendarDays },
    { name: "Club Events", href: "/dashboard/club/events", icon: Award },
    { name: "Discover Clubs", href: "/dashboard/student/clubs", icon: Users },
  ],
};

const roleBadgeStyles: Record<Role, { label: string; color: string }> = {
  STUDENT: { label: "Student", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800" },
  FACULTY: { label: "Faculty", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  ADMIN: { label: "System Admin", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
  PLACEMENT_OFFICER: { label: "Placement Officer", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  CLUB_COORDINATOR: { label: "Club Lead", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800" },
};

export function DashboardSidebar({
  role,
  onCloseMobile,
}: {
  role: Role;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const navItems = roleNavItems[role] || roleNavItems.STUDENT;
  const badge = roleBadgeStyles[role] || roleBadgeStyles.STUDENT;

  return (
    <aside className="w-64 flex flex-col h-full bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              CampusSphere
            </span>
          </div>
        </Link>
      </div>

      {/* Role Pill Indicator */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Active Workspace
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/dashboard/${role.toLowerCase()}` && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/20"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>Security Mode:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">RBAC Strict</span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          SPM Project Ecosystem &bull; v1.0
        </div>
      </div>
    </aside>
  );
}
