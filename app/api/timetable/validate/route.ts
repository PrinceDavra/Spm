import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only administrators can run conflict validation." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const slots = body.slots;

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Slots array required." },
        { status: 400 }
      );
    }

    const report = TimetableService.validateTimetableSlots(slots);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed.";
    return NextResponse.json({ success: false, error: "Validation Error", message }, { status: 500 });
  }
}
