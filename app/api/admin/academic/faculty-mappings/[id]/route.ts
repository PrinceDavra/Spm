import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateFacultyMappingSchema } from "@/validators/academic.schema";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const parsed = updateFacultyMappingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const mapping = await AcademicService.updateFacultyMapping(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, mapping });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update mapping";
    const status = message.includes("not found") ? 404 : 400;
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
    const mapping = await AcademicService.deleteFacultyMapping(id, auth.user.id);
    return NextResponse.json({
      success: true,
      mapping,
      message: "Faculty unmapped successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unmap faculty";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
