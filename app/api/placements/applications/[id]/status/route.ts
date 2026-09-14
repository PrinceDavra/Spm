import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { updateApplicationStatusSchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * PATCH /api/placements/applications/[id]/status
 * Update candidate status in recruitment pipeline (PLACEMENT_OFFICER, ADMIN only).
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
    const parseResult = updateApplicationStatusSchema.safeParse(body);

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

    const updated = await PlacementService.updateApplicationStatus({
      applicationId: id,
      newStatus: parseResult.data.status,
      remarks: parseResult.data.remarks || undefined,
      officerUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Candidate application transitioned to ${parseResult.data.status}.`,
      application: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update application status";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
