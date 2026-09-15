import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateSubjectSchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const subject = await AcademicService.getSubjectById(id);
  if (!subject) {
    return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, subject });
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
    const parsed = updateSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const subject = await AcademicService.updateSubject(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, subject });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update subject";
    const status = message.includes("not found") ? 404 : message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const subject = await AcademicService.deleteSubject(id, auth.user.id);
    return NextResponse.json({ success: true, subject, message: "Subject deactivated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete subject";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
