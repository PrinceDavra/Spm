import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and administrators can access the faculty teaching schedule." },
        { status: 403 }
      );
    }

    const data = await TimetableService.getFacultyTimetable(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/timetable/faculty Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error", message: "Failed to load faculty timetable." },
      { status: 500 }
    );
  }
}
