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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and admin may access attendance marking sheets." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const facultySubjectId = searchParams.get("facultySubjectId");
    const divisionId = searchParams.get("divisionId");
    const date = searchParams.get("date");
    const period = parseInt(searchParams.get("period") || "1", 10);

    if (!facultySubjectId || !divisionId || !date) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "facultySubjectId, divisionId, and date parameters are required." },
        { status: 400 }
      );
    }

    const sheet = await AttendanceService.getAttendanceSheet(
      user.id,
      facultySubjectId,
      divisionId,
      date,
      period
    );

    return NextResponse.json({
      success: true,
      sheet,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sheet.";
    const status = message.includes("Security Violation") ? 403 : 500;
    return NextResponse.json({ success: false, error: "Error", message }, { status });
  }
}
