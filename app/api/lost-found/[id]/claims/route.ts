import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { submitClaimSchema } from "@/validators/lost-found.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/lost-found/[id]/claims
 * Retrieve all claims submitted on a specific item (Item reporter or Admin only).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const reportData = await LostFoundService.getReportById(id, user.id, user.role);
    if (!reportData) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Security: Only the item reporter or Admin can view the list of claims
    if (user.role !== Role.ADMIN && reportData.item.reporterId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only the item reporter or administrators can view submitted claims" },
        { status: 403 }
      );
    }

    const claims = await LostFoundService.getClaims({ itemId: id, userId: user.id, role: user.role });
    return NextResponse.json({ success: true, claims });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve claims";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/lost-found/[id]/claims
 * Submit a proof-of-ownership claim on a published item.
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
    const parseResult = submitClaimSchema.safeParse({ ...body, itemId });

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

    const claim = await LostFoundService.submitClaim(
      itemId,
      parseResult.data,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Ownership claim submitted successfully. Campus staff and reporter will review your proof.",
      claim,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit claim";
    let status = 400;
    if (message.includes("already submitted an active claim")) status = 409;
    if (message.includes("own report")) status = 400;
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
