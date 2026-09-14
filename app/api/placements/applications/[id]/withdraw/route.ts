import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { Role } from "@prisma/client";

/**
 * POST /api/placements/applications/[id]/withdraw
 * Student self-withdraws their application from a placement drive.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.STUDENT]);
    if (error) return error;

    const { id } = await params;
    const updated = await PlacementService.withdrawApplication(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Your application has been safely withdrawn.",
      application: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to withdraw application";
    let status = 400;
    if (message.includes("not found")) status = 404;
    if (message.includes("Unauthorized") || message.includes("Forbidden")) status = 403;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
