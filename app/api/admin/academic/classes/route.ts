import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createClassSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") || undefined;
  const semesterParam = searchParams.get("semester");
  const semester = semesterParam ? parseInt(semesterParam, 10) : undefined;
  const academicYear = searchParams.get("academicYear") || undefined;

  const classes = await AcademicService.getClasses({ departmentId, semester, academicYear });
  return NextResponse.json({ success: true, classes });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newClass = await AcademicService.createClass(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, class: newClass }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create class";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
