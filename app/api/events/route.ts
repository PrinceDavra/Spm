import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { createEventSchema } from "@/validators/event.schema";
import { Role, EventCategory, EventStatus } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/events
 * Discovery feed with role-based scoping, search, category, status, and tab filters.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required to access campus events." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = (searchParams.get("category") as EventCategory) || undefined;
    const status = (searchParams.get("status") as EventStatus) || undefined;
    const tab = (searchParams.get("tab") as "all" | "upcoming" | "registered" | "completed") || "all";
    const sortBy = (searchParams.get("sortBy") as "upcoming" | "latest" | "most_registered" | "date_asc") || "upcoming";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await EventService.getEvents({
      userId: user.id,
      role: user.role,
      search,
      category,
      status,
      tab,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      events: result.events,
      total: result.total,
    });
  } catch (err: unknown) {
    console.error("GET /api/events error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new campus event (ADMIN, FACULTY, CLUB_COORDINATOR, PLACEMENT_OFFICER).
 * Students are strictly forbidden (HTTP 403).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required to create an event." },
        { status: 401 }
      );
    }

    const allowedRoles: Role[] = [Role.ADMIN, Role.FACULTY, Role.CLUB_COORDINATOR, Role.PLACEMENT_OFFICER];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Students are not permitted to create or organize campus events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = createEventSchema.safeParse(body);

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

    const newEvent = await EventService.createEvent(parseResult.data, {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully.",
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("POST /api/events error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err instanceof Error ? err.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
