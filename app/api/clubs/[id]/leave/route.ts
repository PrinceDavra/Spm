import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";

/**
 * POST /api/clubs/[id]/leave
 * Student leaves an active club or withdraws a pending application.
 */
export async function POST(
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
    const result = await ClubService.leaveClub(id, user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to leave club";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
