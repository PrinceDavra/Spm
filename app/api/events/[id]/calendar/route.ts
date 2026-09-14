import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { generateICS } from "@/lib/event/ics-generator";

/**
 * GET /api/events/[id]/calendar
 * Downloads standard RFC 5545 iCalendar (.ics) event file.
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
    const event = await EventService.getEventById(id, user.id, user.role);

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: "Event not found." },
        { status: 404 }
      );
    }

    const icsContent = generateICS({
      id: event.id,
      title: event.title,
      description: event.description,
      summary: event.summary,
      venue: event.venue,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      organizerName: event.organizerName,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug || "event"}.ics"`,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/events/[id]/calendar error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: "Failed to generate calendar export" },
      { status: 500 }
    );
  }
}
