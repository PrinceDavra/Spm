import { NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";

export async function GET() {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const healthReport = await AcademicService.auditConfigurationHealth();
  return NextResponse.json({ success: true, ...healthReport });
}
