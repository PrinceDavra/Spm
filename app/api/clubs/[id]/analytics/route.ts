import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";

/**
 * GET /api/clubs/[id]/analytics
 * Fetch telemetry & engagement metrics for a club (Coordinator / Advisor / Admin only).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const analytics = await ClubService.getClubAnalytics(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch club analytics";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
