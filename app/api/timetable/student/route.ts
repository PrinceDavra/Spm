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

    if (user.role !== Role.STUDENT && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only students and administrators can access the student timetable." },
        { status: 403 }
      );
    }

    const data = await TimetableService.getStudentTimetable(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/timetable/student Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error", message: "Failed to load student timetable." },
      { status: 500 }
    );
  }
}
