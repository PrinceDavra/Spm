import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { reviewClaimSchema } from "@/validators/lost-found.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * POST /api/lost-found/claims/[id]/review
 * Admin moderation and claim verification endpoint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.ADMIN]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = reviewClaimSchema.safeParse(body);

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

    const updatedClaim = await LostFoundService.reviewClaim(
      id,
      parseResult.data,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: `Claim status updated to ${updatedClaim.status}.`,
      claim: updatedClaim,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review claim";
    let status = 400;
    if (message.includes("Forbidden")) status = 403;
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
