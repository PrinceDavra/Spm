import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/services/academic.service";
import { FacultyMappingManager } from "@/components/admin/academic/faculty-mapping-manager";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function AdminFacultyMappingPage() {
  await requireRole([Role.ADMIN]);

  const mappings = await AcademicService.getFacultyMappings();
  const subjects = await AcademicService.getSubjects();
  const divisions = await AcademicService.getDivisions();
  const workload = await AcademicService.calculateFacultyWorkload();

  const facultyList = DEMO_USERS.filter((u) => u.role === Role.FACULTY || u.role === Role.ADMIN);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/admin" className="hover:text-slate-900 dark:hover:text-white">
          Admin
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/dashboard/admin/academic" className="hover:text-slate-900 dark:hover:text-white">
          Academic Setup
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Faculty Allocation</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Faculty Teaching Allocation & Workload Desk
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Map accredited faculty members to divisions and subjects with deterministic teaching period calculations.
        </p>
      </div>

      {/* Interactive Client Manager */}
      <FacultyMappingManager
        initialMappings={mappings}
        facultyList={facultyList}
        subjects={subjects}
        divisions={divisions}
        workload={workload}
      />
    </div>
  );
}
