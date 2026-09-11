import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AttendanceService } from "@/services/attendance.service";
import { editAttendanceRecordSchema } from "@/validators/attendance.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

export async function PATCH(
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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and admin may edit recorded attendance." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = editAttendanceRecordSchema.parse(body);

    const result = await AttendanceService.editAttendanceRecord(
      user.id,
      id,
      validatedData.status,
      validatedData.reasonForEdit
    );

    return NextResponse.json({
      success: true,
      message: "Attendance record updated successfully with audit trail.",
      result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to edit attendance record.";
    const status = message.includes("Security Violation") ? 403 : 400;

    return NextResponse.json({ success: false, error: "Edit Error", message }, { status });
  }
}
