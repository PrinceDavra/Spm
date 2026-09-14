import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";

/**
 * GET /api/clubs/my-clubs
 * Returns the clubs that the authenticated user belongs to or has applied for.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { active, pending, previous } = await ClubService.getUserClubs(user.id);

    return NextResponse.json({
      success: true,
      active,
      activeClubs: active,
      pending,
      pendingClubs: pending,
      previous,
      previousClubs: previous,
      totalActive: active.length,
      totalPending: pending.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user clubs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
