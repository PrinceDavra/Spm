import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { Role } from "@prisma/client";

/**
 * GET /api/placements/applications/[id]
 * Fetch application details with drive, company, student, and status history.
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

    // Role verification: Students can only view their own applications
    if (user.role === Role.STUDENT && application.student.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot view another student's application" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve application";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
