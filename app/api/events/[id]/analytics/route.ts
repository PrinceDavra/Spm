import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";

/**
 * GET /api/events/[id]/analytics
 * Returns calculated event analytics (Organizer / Admin only).
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
    const analytics = await EventService.getEventAnalytics(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve analytics";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
