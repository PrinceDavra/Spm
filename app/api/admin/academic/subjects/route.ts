import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role, SubjectType } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createSubjectSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") || undefined;
  const semesterParam = searchParams.get("semester");
  const semester = semesterParam ? parseInt(semesterParam, 10) : undefined;
  const typeParam = searchParams.get("type");
  const type = typeParam ? (typeParam as SubjectType) : undefined;
  const search = searchParams.get("search") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

  const subjects = await AcademicService.getSubjects({
    departmentId,
    semester,
    type,
    isActive,
    search,
  });
  return NextResponse.json({ success: true, subjects });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const subject = await AcademicService.createSubject(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, subject }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create subject";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
