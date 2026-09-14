import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { Role } from "@prisma/client";

/**
 * POST /api/events/[id]/publish
 * Publishes a draft event and opens registrations.
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

    if (user.role === Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Students cannot publish events." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const publishedEvent = await EventService.publishEvent(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Event published successfully and registrations are active.",
      event: publishedEvent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish event";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
