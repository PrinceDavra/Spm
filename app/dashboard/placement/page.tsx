import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import {
  Briefcase,
  Building2,
  FileCheck,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default async function PlacementDashboardPage() {
  const user = await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg shadow-amber-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Corporate Relations &amp; Placement Cell</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Placement Command &bull; {user.firstName} {user.lastName}
          </h1>
          <p className="mt-2 text-sm text-amber-100/80 leading-relaxed">
            Manage company recruitment partnerships, on-campus job drives, student application pipelines,
            and aptitude preparation quizzes.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Job Drives
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">12 Drives</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Avg Package: 14.5 LPA
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Corporate Partners
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">28</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Google, Microsoft, TCS, Infosys, etc.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Applications
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">340</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            68 Shortlisted for Technical Round
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practice Question Bank
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">120+</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Aptitude, Reasoning &amp; Coding
          </div>
        </div>
      </div>
    </div>
  );
}
