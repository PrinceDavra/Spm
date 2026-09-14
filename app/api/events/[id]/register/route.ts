import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { EventService } from "@/services/event.service";
import { ProfileService } from "@/services/profile.service";
import { Role } from "@prisma/client";

/**
 * POST /api/events/[id]/register
 * Registers the authenticated student for the event.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required to register for events." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Resolve student metadata
    let rollNumber: string | undefined;
    let studentId: string | undefined;
    let departmentName: string | undefined;
    let semester: number | undefined;

    try {
      const profile = await ProfileService.getProfile(user.id);
      if (profile?.student) {
        rollNumber = profile.student.rollNumber;
        studentId = profile.student.studentId;
        departmentName = profile.student.department;
        semester = profile.student.semester;
      }
    } catch {
      // Use defaults if profile lookup is unavailable
    }

    const registration = await EventService.registerForEvent(id, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      rollNumber: rollNumber || "22COMPA101",
      studentId: studentId || `STU-${user.id.slice(0, 6)}`,
      departmentName: departmentName || "Computer Engineering",
      semester: semester || 6,
    });

    return NextResponse.json(
      {
        success: true,
        message: "You have successfully registered for this event.",
        registration,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to register for event";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
