import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { Role } from "@prisma/client";

/**
 * GET /api/placements/drives/[id]/eligibility
 * Evaluate server-side student eligibility for a specific drive with transparent breakdown.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Officers/Admins can query eligibility on behalf of a specific studentId
    let targetStudentUserId = user.id;
    if (user.role !== Role.STUDENT) {
      const studentIdParam = searchParams.get("studentId");
      if (studentIdParam) {
        targetStudentUserId = studentIdParam;
      }
    }

    const eligibility = await PlacementService.checkStudentEligibility(
      targetStudentUserId,
      id
    );

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate eligibility";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
