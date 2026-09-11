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
        { success: false, error: "Forbidden", message: "Only faculty and admin may access attendance analytics." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const facultySubjectId = searchParams.get("facultySubjectId");

    if (!facultySubjectId) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "facultySubjectId parameter is required." },
        { status: 400 }
      );
    }

    const analytics = await AttendanceService.getFacultyAnalytics(user.id, facultySubjectId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics.";
    return NextResponse.json({ success: false, error: "Analytics Error", message }, { status: 400 });
  }
}
