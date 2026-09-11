import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AttendanceService } from "@/services/attendance.service";
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
        { success: false, error: "Forbidden", message: "Only faculty and admin may access subject allocations." },
        { status: 403 }
      );
    }

    const subjects = await AttendanceService.getFacultySubjects(user.id);

    return NextResponse.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error("GET /api/attendance/faculty-subjects Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: "Failed to load subjects." },
      { status: 500 }
    );
  }
}
