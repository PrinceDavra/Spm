import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";

/**
 * DELETE /api/clubs/[id]/activities/[activityId]
 * Delete a club activity (Coordinator / Advisor / Admin only).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id, activityId } = await params;
    await ClubService.deleteActivity(id, activityId, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Activity deleted successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete activity";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
