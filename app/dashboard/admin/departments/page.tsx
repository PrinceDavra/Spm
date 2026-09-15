import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/services/academic.service";
import { DepartmentManager } from "@/components/admin/academic/department-manager";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function AdminDepartmentsPage() {
  await requireRole([Role.ADMIN]);

  const departments = await AcademicService.getDepartments();

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
        <span className="font-semibold text-slate-900 dark:text-white">Departments</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Department Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Create, configure, and manage college academic departments, department codes, and HOD assignments.
        </p>
      </div>

      {/* Interactive Manager */}
      <DepartmentManager initialDepartments={departments} />
    </div>
  );
}
