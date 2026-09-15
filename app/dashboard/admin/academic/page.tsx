import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/services/academic.service";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Sliders,
  Building,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react";

export default async function AcademicSetupHubPage() {
  await requireRole([Role.ADMIN]);

  const departments = await AcademicService.getDepartments();
  const programs = await AcademicService.getPrograms();
  const batches = await AcademicService.getBatches();
  const divisions = await AcademicService.getDivisions();
  const subjects = await AcademicService.getSubjects();
  const mappings = await AcademicService.getFacultyMappings();
  const rooms = await AcademicService.getRooms();
  const laboratories = await AcademicService.getLaboratories();
  const health = await AcademicService.auditConfigurationHealth();

  const activeDepartmentsCount = departments.filter((d) => d.isActive).length;
  const activeProgramsCount = programs.filter((p) => p.isActive).length;
  const activeBatchesCount = batches.filter((b) => b.isActive).length;
  const activeDivisionsCount = divisions.filter((d) => d.isActive).length;
  const activeSubjectsCount = subjects.filter((s) => s.isActive).length;
  const activeMappingsCount = mappings.filter((m) => m.isActive).length;
  const activeRoomsCount = rooms.filter((r) => r.isActive).length;
  const activeLabsCount = laboratories.filter((l) => l.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CampusSphere Academic Administration &bull; Institutional Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Infrastructure & Setup Hub
          </h1>
          <p className="mt-2 text-sm text-indigo-100/80 leading-relaxed">
            Central command for collegiate academic hierarchy, department governance, program curriculums,
            divisions, course syllabus, faculty teaching allocations, physical facilities, and CSP timetable engine readiness.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Health Indicator Banner */}
      <div
        className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          health.status === "HEALTHY"
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
            : health.status === "WARNING"
            ? "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            : "border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              health.status === "HEALTHY"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                : health.status === "WARNING"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
            }`}
          >
            {health.status === "HEALTHY" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : health.status === "WARNING" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide uppercase">
                Configuration Health: {health.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-white/60 dark:bg-slate-900/60">
                {health.totalIssues === 0 ? "0 Issues Detected" : `${health.totalIssues} Issues Flagged`}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {health.status === "HEALTHY"
                ? "All academic dependencies, faculty workloads, room links, and capacities pass validation."
                : `${health.errorCount} critical errors and ${health.warningCount} configuration warnings detected across academic entities.`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/admin/configuration-health"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-750 shrink-0"
        >
          <span>Open Health Console</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Departments</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{activeDepartmentsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Programs</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{activeProgramsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Batches</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{activeBatchesCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Divisions</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{activeDivisionsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Subjects</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{activeSubjectsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Allocations</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{activeMappingsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Rooms</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{activeRoomsCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Laboratories</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{activeLabsCount}</span>
        </div>
      </div>

      {/* Navigation Sub-Modules Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Academic Management Consoles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Departments */}
          <Link
            href="/dashboard/admin/departments"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition dark:bg-indigo-950/60 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Departments</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure academic branches, HOD assignments, department codes, and division hierarchies.
            </p>
            <div className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {departments.length} Active Departments &rarr;
            </div>
          </Link>

          {/* Programs & Batches */}
          <Link
            href="/dashboard/admin/programs"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition dark:bg-purple-950/60 dark:text-purple-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Programs & Batches</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Degrees (B.Tech, MCA), degree duration, semester counts, and student intake cohorts.
            </p>
            <div className="mt-3 text-xs font-semibold text-purple-600 dark:text-purple-400">
              {programs.length} Programs &bull; {batches.length} Batches &rarr;
            </div>
          </Link>

          {/* Classes & Divisions */}
          <Link
            href="/dashboard/admin/classes"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition dark:bg-blue-950/60 dark:text-blue-400">
                <Layers className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Classes & Divisions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Class years (FE, SE, TE, BE), division rosters (CE-A, CE-B), and student capacities.
            </p>
            <div className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400">
              {divisions.length} Divisions across {departments.length} Depts &rarr;
            </div>
          </Link>

          {/* Subjects & Syllabus */}
          <Link
            href="/dashboard/admin/subjects"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition dark:bg-amber-950/60 dark:text-amber-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Subjects & Syllabus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Course catalogs, Theory vs Practical Lab formats, credits, weekly hours, and syllabus links.
            </p>
            <div className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {subjects.length} Accredited Subjects &rarr;
            </div>
          </Link>

          {/* Faculty Allocation */}
          <Link
            href="/dashboard/admin/faculty-mapping"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition dark:bg-emerald-950/60 dark:text-emerald-400">
                <Sliders className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Faculty Allocation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Map faculty members to subjects and divisions with deterministic workload tracking.
            </p>
            <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {mappings.length} Active Allocations &rarr;
            </div>
          </Link>

          {/* Rooms & Laboratories */}
          <Link
            href="/dashboard/admin/rooms"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition dark:bg-rose-950/60 dark:text-rose-400">
                <Building className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Rooms & Laboratories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage classrooms, specialized computing labs, equipment lists, and capacity constraints.
            </p>
            <div className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {rooms.length} Rooms &bull; {laboratories.length} Laboratories &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Department Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">Overview of academic departments and mapped assets</p>
          </div>
          <Link
            href="/dashboard/admin/departments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Manage Departments &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Head of Department</th>
                <th className="p-3.5 text-center">Programs</th>
                <th className="p-3.5 text-center">Subjects</th>
                <th className="p-3.5 text-center">Laboratories</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">{dept.name}</td>
                  <td className="p-3.5">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {dept.code}
                    </span>
                  </td>
                  <td className="p-3.5">{dept.headOfDepartment || "Unassigned"}</td>
                  <td className="p-3.5 text-center font-semibold">{dept.programsCount}</td>
                  <td className="p-3.5 text-center font-semibold">{dept.subjectsCount}</td>
                  <td className="p-3.5 text-center font-semibold">{dept.labsCount}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dept.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {dept.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
