import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";

/**
 * GET /api/events/registered
 * Returns all upcoming and past events registered by the authenticated user.
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

    const { upcoming, past } = await EventService.getUserRegistrations(user.id);

    return NextResponse.json({
      success: true,
      upcoming,
      past,
      totalRegistered: upcoming.length + past.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/events/registered error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err instanceof Error ? err.message : "Failed to fetch registered events" },
      { status: 500 }
    );
  }
}
