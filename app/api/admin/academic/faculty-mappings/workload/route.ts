import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN, Role.FACULTY]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get("facultyId") || undefined;

  const workload = await AcademicService.calculateFacultyWorkload(facultyId);
  return NextResponse.json({ success: true, workload });
}
