import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { Role } from "@prisma/client";

/**
 * GET /api/placements/applications/[id]/history
 * Retrieve full transition audit history of an application.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const application = await PlacementService.getApplicationById(id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    if (user.role === Role.STUDENT && application.student.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot access history for another student's application" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      history: application.statusHistory,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve application history";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
