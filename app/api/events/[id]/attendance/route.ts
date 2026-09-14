import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { markAttendanceSchema } from "@/validators/event.schema";
import { ZodError } from "zod";

/**
 * POST /api/events/[id]/attendance
 * Records attendance for a registered participant (Organizer / Admin only).
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
    const body = await req.json();
    const parseResult = markAttendanceSchema.safeParse(body);

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

    const { registrationId, userId, attendanceStatus } = parseResult.data;
    const targetIdentifier = registrationId || userId;

    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, error: "Validation Error", message: "Either registrationId or userId must be provided" },
        { status: 400 }
      );
    }

    const updatedParticipant = await EventService.markAttendance(
      id,
      targetIdentifier,
      attendanceStatus,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: `Participant attendance marked as ${attendanceStatus}.`,
      participant: updatedParticipant,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record attendance";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
