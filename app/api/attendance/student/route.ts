import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AttendanceService } from "@/services/attendance.service";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only students may access student attendance records." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const target = parseInt(searchParams.get("target") || "75", 10);
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const status = searchParams.get("status") || undefined;
    const year = parseInt(searchParams.get("year") || "2026", 10);
    const month = parseInt(searchParams.get("month") || "9", 10);

    const summary = await AttendanceService.getStudentSummary(user.id, target);
    const history = await AttendanceService.getStudentHistory(user.id, { subjectCode, status });
    const calendar = await AttendanceService.getStudentCalendar(user.id, year, month);

    return NextResponse.json({
      success: true,
      summary,
      history,
      calendar,
    });
  } catch (error) {
    console.error("GET /api/attendance/student Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: "Failed to load student attendance." },
      { status: 500 }
    );
  }
}
