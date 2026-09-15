import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateLaboratorySchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const laboratory = await AcademicService.getLaboratoryById(id);
  if (!laboratory) {
    return NextResponse.json({ success: false, error: "Laboratory not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, laboratory });
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
    const parsed = updateLaboratorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const laboratory = await AcademicService.updateLaboratory(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, laboratory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update laboratory";
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
    const laboratory = await AcademicService.deleteLaboratory(id, auth.user.id);
    return NextResponse.json({
      success: true,
      laboratory,
      message: "Laboratory deactivated successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete laboratory";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
