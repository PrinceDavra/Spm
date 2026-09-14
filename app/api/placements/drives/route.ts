import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { createDriveSchema } from "@/validators/placement.schema";
import { EmploymentType, PlacementDriveStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/placements/drives
 * List placement drives with multi-criteria filtering and student eligibility indicators.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as PlacementDriveStatus) || undefined;
    const employmentType = (searchParams.get("employmentType") as EmploymentType) || undefined;
    const companyId = searchParams.get("companyId") || undefined;
    const location = searchParams.get("location") || undefined;
    const eligibleOnly = searchParams.get("eligibleOnly") === "true";

    const { drives, total } = await PlacementService.getDrives({
      search,
      status,
      employmentType,
      companyId,
      location,
      userId: user.id,
      userRole: user.role,
      eligibleOnly,
    });

    return NextResponse.json({
      success: true,
      drives,
      total,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch placement drives";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/placements/drives
 * Create a new placement drive (PLACEMENT_OFFICER, ADMIN only).
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const parseResult = createDriveSchema.safeParse(body);

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

    const drive = await PlacementService.createDrive(parseResult.data, user.id);

    return NextResponse.json(
      {
        success: true,
        message: `Placement Drive "${drive.title}" created in DRAFT state.`,
        drive,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create placement drive";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
