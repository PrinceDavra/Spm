import Link from "next/link";
import {
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                CampusSphere
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Academic Ecosystem
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 mr-4">
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Modules
              </a>
              <a href="#roles" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                User Roles
              </a>
              <a href="#architecture" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Architecture
              </a>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Enter Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[450px] w-[600px] rounded-full bg-gradient-to-tr from-indigo-400/15 to-violet-400/15 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-medium text-indigo-800 shadow-sm backdrop-blur dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-300 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Software Project Management (SPM) Academic System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            The Modern Operating System for{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Campus Intelligence
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CampusSphere unifies constraint-based timetable scheduling, transparent attendance risk projections, placement preparation, and multi-role academic workflows into one cohesive, production-grade platform.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              <span>Launch Demo Portals</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Explore Modules
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">5 Roles</div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Strict Server RBAC</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">CSP Engine</div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Conflict-Free Timetable</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">75% Target</div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Projection</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">24+ Models</div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">PostgreSQL + Prisma</div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Modules Section */}
      <section id="features" className="py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200/60 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              End-to-End Capabilities
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Engineered for Real Academic Workflows
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Every module is backed by live database relationships, rigorous business logic, and server-side authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Timetable Engine */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-5">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Constraint Timetable Generator</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Deterministic backtracking algorithm satisfying hard constraints: zero faculty clashes, zero room double-bookings, consecutive lab periods, and balanced weekly workload.
              </p>
            </div>

            {/* Attendance Projection */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance Projection</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Honest mathematical modeling calculating exact consecutive classes required to reach 75% or bunk margins without false machine learning claims.
              </p>
            </div>

            {/* Assignment Lifecycle */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-5">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Assignment Lifecycle</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Faculty assignment authoring with deadlines, student submissions with status tracking (Pending, Submitted, Late), and in-app evaluation with grade feedback.
              </p>
            </div>

            {/* Placement Preparation */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mb-5">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Placement Hub & Quizzes</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Active job drives with eligibility checks, timed aptitude quizzes, question banks, and student application progress tracking.
              </p>
            </div>

            {/* Club Management */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Club & Event Ecosystem</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Membership requests and coordinator approval, event discovery with capacity quotas, and participant attendance management.
              </p>
            </div>

            {/* Lost & Found */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-md hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 mb-5">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lost & Found Community</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Community reporting portal for lost campus belongings with proof-of-ownership claim verification and administrative moderation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Access Section */}
      <section id="roles" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Role-Based Access Control
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tailored Portals for Every Stakeholder
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                role: "STUDENT",
                title: "Student Portal",
                desc: "Attendance tracking, timetable, assignments, quizzes, clubs & lost-found.",
                color: "border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20",
              },
              {
                role: "FACULTY",
                title: "Faculty Console",
                desc: "Attendance marking sheet, assignment grading drawer & subject rosters.",
                color: "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20",
              },
              {
                role: "ADMIN",
                title: "Admin Command",
                desc: "Full institutional governance, timetable solver, users & audit logs.",
                color: "border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20",
              },
              {
                role: "PLACEMENT_OFFICER",
                title: "Placement Cell",
                desc: "Drive management, corporate CRM, applicant shortlists & aptitude banks.",
                color: "border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20",
              },
              {
                role: "CLUB_COORDINATOR",
                title: "Club Executive",
                desc: "Member approvals, event organizing, rosters & community broadcasts.",
                color: "border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20",
              },
            ].map((item) => (
              <div
                key={item.role}
                className={`rounded-xl border p-5 transition-all hover:scale-[1.02] ${item.color}`}
              >
                <div className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  {item.role}
                </div>
                <div className="mt-2 font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            CampusSphere &copy; {new Date().getFullYear()} &mdash; Software Project Management (SPM) Academic Project.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Strict Server-Side RBAC
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              Prisma + PostgreSQL
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
