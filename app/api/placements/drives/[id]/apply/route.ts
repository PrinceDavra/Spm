import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { applyDriveSchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * POST /api/placements/drives/[id]/apply
 * Submit student application to a drive with strict server-side eligibility verification.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.STUDENT]);
    if (error) return error;

    const { id: driveId } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = applyDriveSchema.safeParse(body);

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

    const application = await PlacementService.applyToDrive({
      driveId,
      studentUserId: user.id,
      resumeUrl: parseResult.data.resumeUrl,
      coverNote: parseResult.data.coverNote || parseResult.data.notes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully! Our placement cell and recruiter have received your profile.",
        application,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit application";
    let status = 400;
    if (message.includes("not found")) status = 404;
    if (message.includes("already applied") || message.includes("already submitted")) status = 409;
    if (message.includes("Ineligible")) status = 403;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
