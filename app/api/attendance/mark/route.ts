import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AttendanceService } from "@/services/attendance.service";
import { markAttendanceSchema } from "@/validators/attendance.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only faculty members may mark attendance." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = markAttendanceSchema.parse(body);

    const result = await AttendanceService.markAttendance(user.id, validatedData);

    return NextResponse.json({
      success: true,
      message: `Attendance successfully recorded for ${result.recordsMarked} students.`,
      result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to mark attendance.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("Duplicate Attendance")
      ? 409
      : 400;

    return NextResponse.json({ success: false, error: "Attendance Error", message }, { status });
  }
}
