import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { updateEventSchema } from "@/validators/event.schema";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]
 * Retrieves event details by ID or slug, enriched with caller's registration status.
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
        { success: false, error: "Not Found", message: "Event not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (err: unknown) {
    console.error("GET /api/events/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err instanceof Error ? err.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Updates event details (ADMIN or event organizer only).
 */
export async function PATCH(
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
    const body = await req.json();
    const parseResult = updateEventSchema.safeParse(body);

    if (!parseResult.success) {
      const error = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedEvent = await EventService.updateEvent(id, parseResult.data, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully.",
      event: updatedEvent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update event";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
