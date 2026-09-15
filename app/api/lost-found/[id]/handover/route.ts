import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { handoverSchema } from "@/validators/lost-found.schema";
import { ZodError } from "zod";

/**
 * POST /api/lost-found/[id]/handover
 * Confirm item handover to verified claimant and mark case resolved.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id: itemId } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = handoverSchema.safeParse(body);

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

    const { item, claim } = await LostFoundService.completeHandover(
      itemId,
      parseResult.data,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: "Handover completed successfully! The item has been marked as RESOLVED.",
      item,
      claim,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete handover";
    let status = 400;
    if (message.includes("Forbidden")) status = 403;
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
