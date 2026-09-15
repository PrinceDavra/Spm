import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { ClaimStatus } from "@prisma/client";

/**
 * GET /api/lost-found/claims
 * Returns claims list.
 * Students view their own submitted claims; Administrators view the master claim queue.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ClaimStatus | null;
    const itemIdParam = searchParams.get("itemId");

    const claims = await LostFoundService.getClaims({
      userId: user.id,
      role: user.role,
      status: statusParam || undefined,
      itemId: itemIdParam || undefined,
    });

    return NextResponse.json({ success: true, claims });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch claims";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
