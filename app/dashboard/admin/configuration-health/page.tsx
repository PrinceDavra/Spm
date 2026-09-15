import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/services/academic.service";
import { ConfigurationHealthView } from "@/components/admin/academic/configuration-health-view";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function AdminConfigurationHealthPage() {
  await requireRole([Role.ADMIN]);

  const healthReport = await AcademicService.auditConfigurationHealth();

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
        <span className="font-semibold text-slate-900 dark:text-white">Configuration Health</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Academic Configuration Health & Timetable Prerequisite Audit
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated institutional integrity audits, unmapped subject detection, workload anomalies, and physical facility validation.
        </p>
      </div>

      {/* Interactive Health View */}
      <ConfigurationHealthView initialReport={healthReport} />
    </div>
  );
}
