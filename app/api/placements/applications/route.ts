import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { ApplicationStatus, Role } from "@prisma/client";

/**
 * GET /api/placements/applications
 * List applications: students see only their own; placement officers and admins can query all.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get("driveId") || undefined;
    const status = (searchParams.get("status") as ApplicationStatus) || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    // Student role is strictly scoped to their own studentUserId
    const scopedStudentUserId = user.role === Role.STUDENT ? user.id : studentId;

    const applications = await PlacementService.getApplications({
      driveId,
      status,
      studentUserId: scopedStudentUserId,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      applications,
      total: applications.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch applications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
