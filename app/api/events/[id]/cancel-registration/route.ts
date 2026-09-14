import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";

/**
 * POST /api/events/[id]/cancel-registration
 * Cancels active event registration and frees capacity.
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
    const result = await EventService.cancelRegistration(id, user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel registration";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
