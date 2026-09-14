import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { RegistrationStatus, EventAttendanceStatus } from "@prisma/client";

/**
 * GET /api/events/[id]/participants
 * Retrieves participant roster (Organizer / Admin only).
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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as RegistrationStatus) || undefined;
    const attendanceStatus = (searchParams.get("attendanceStatus") as EventAttendanceStatus) || undefined;

    const result = await EventService.getParticipants(id, user.id, user.role, {
      search,
      status,
      attendanceStatus,
    });

    return NextResponse.json({
      success: true,
      participants: result.participants,
      total: result.total,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve participants";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
