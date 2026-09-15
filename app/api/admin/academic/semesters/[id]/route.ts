import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateSemesterSchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const semester = await AcademicService.getSemesterById(id);
  if (!semester) {
    return NextResponse.json({ success: false, error: "Semester not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, semester });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const parsed = updateSemesterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const semester = await AcademicService.updateSemester(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, semester });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update semester";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
