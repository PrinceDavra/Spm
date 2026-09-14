import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { ProfileService } from "@/services/profile.service";
import { joinClubSchema } from "@/validators/club.schema";

/**
 * POST /api/clubs/[id]/join
 * Student submits application to join a club.
 */
export async function POST(
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

    const { id } = await params;
    let message: string | undefined;

    try {
      const body = await req.json();
      const parseResult = joinClubSchema.safeParse(body);
      if (parseResult.success) {
        message = parseResult.data.message;
      }
    } catch {
      // Empty body is acceptable
    }

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

    const membership = await ClubService.requestMembership(
      id,
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: studentId || `STU-${user.id.slice(0, 6)}`,
        rollNumber: rollNumber || "22COMPA101",
        departmentName: departmentName || user.departmentName || "Computer Engineering",
        semester: semester || 6,
      },
      message
    );

    return NextResponse.json(
      {
        success: true,
        message: "Membership request submitted successfully. Awaiting coordinator approval.",
        membership,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to join club";
    const status =
      message.includes("already") || message.includes("suspended") || message.includes("archived")
        ? 400
        : message.includes("not found")
        ? 404
        : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
