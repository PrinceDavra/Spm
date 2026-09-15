import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateDepartmentSchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const department = await AcademicService.getDepartmentById(id);
  if (!department) {
    return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, department });
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
    const parsed = updateDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const department = await AcademicService.updateDepartment(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, department });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update department";
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
    const department = await AcademicService.deleteDepartment(id, auth.user.id);
    return NextResponse.json({ success: true, department, message: "Department deactivated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete department";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
