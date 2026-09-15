import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * POST /api/lost-found/claims/[id]/withdraw
 * Withdraw an active claim (Claimant only).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const claim = await LostFoundService.withdrawClaim(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Claim withdrawn successfully.",
      claim,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to withdraw claim";
    let status = 400;
    if (message.includes("Forbidden")) status = 403;
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
