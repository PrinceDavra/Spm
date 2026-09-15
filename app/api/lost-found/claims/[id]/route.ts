import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * GET /api/lost-found/claims/[id]
 * Retrieve detailed claim information with verification proof answers.
 * Access is strictly restricted to the claimant, item reporter, or Admin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const claim = await LostFoundService.getClaimById(id, user.id, user.role);

    if (!claim) {
      return NextResponse.json(
        { success: false, error: "Claim not found or you are not authorized to view this claim" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, claim });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch claim";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
