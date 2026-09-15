import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createFacultyMappingSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get("facultyId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const divisionId = searchParams.get("divisionId") || undefined;
  const academicYear = searchParams.get("academicYear") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

  const mappings = await AcademicService.getFacultyMappings({
    facultyId,
    subjectId,
    divisionId,
    academicYear,
    isActive,
  });
  return NextResponse.json({ success: true, mappings });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createFacultyMappingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const mapping = await AcademicService.createFacultyMapping(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, mapping }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to map faculty";
    const status = message.includes("already mapped") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
