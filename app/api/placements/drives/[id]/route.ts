import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { updateDriveSchema } from "@/validators/placement.schema";
import { PlacementDriveStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/placements/drives/[id]
 * Fetch detailed drive info with company, criteria, and dynamic eligibility result.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const drive = await PlacementService.getDriveById(id);

    if (!drive) {
      return NextResponse.json(
        { success: false, error: "Placement drive not found" },
        { status: 404 }
      );
    }

    // Role check: Students cannot see unpublished drives unless it's an officer/admin
    if (user.role === Role.STUDENT && drive.status === PlacementDriveStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: "Placement drive is not published" },
        { status: 403 }
      );
    }

    let eligibility = null;
    let existingApplication = null;

    if (user.role === Role.STUDENT) {
      eligibility = await PlacementService.checkStudentEligibility(user.id, id);
      existingApplication = await PlacementService.getStudentApplicationForDrive(user.id, id);
    }

    return NextResponse.json({
      success: true,
      drive,
      eligibility,
      existingApplication,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve drive";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/placements/drives/[id]
 * Update drive parameters (PLACEMENT_OFFICER, ADMIN only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parseResult = updateDriveSchema.safeParse(body);

    if (!parseResult.success) {
      const zodError = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: zodError.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await PlacementService.updateDrive(id, parseResult.data, user.id);
    return NextResponse.json({
      success: true,
      message: "Placement drive updated successfully",
      drive: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update drive";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
