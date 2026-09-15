import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateBatchSchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const batch = await AcademicService.getBatchById(id);
  if (!batch) {
    return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, batch });
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
    const parsed = updateBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const batch = await AcademicService.updateBatch(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, batch });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update batch";
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
    const batch = await AcademicService.deleteBatch(id, auth.user.id);
    return NextResponse.json({ success: true, batch, message: "Batch deactivated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete batch";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
