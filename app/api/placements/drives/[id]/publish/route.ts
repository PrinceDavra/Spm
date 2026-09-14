import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { Role } from "@prisma/client";

/**
 * POST /api/placements/drives/[id]/publish
 * Transition drive from DRAFT to PUBLISHED status and alert students (PLACEMENT_OFFICER, ADMIN only).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const { id } = await params;
    const drive = await PlacementService.publishDrive(id, user.id);

    return NextResponse.json({
      success: true,
      message: `Placement Drive "${drive.title}" is now PUBLISHED.`,
      drive,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish drive";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
