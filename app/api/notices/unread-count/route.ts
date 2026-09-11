import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { ProfileService } from "@/services/profile.service";
import { Role } from "@prisma/client";

async function resolveUserContext(userId: string, role: Role | string) {
  let departmentId: string | null = null;
  let divisionId: string | null = null;
  let semester: number | null = null;

  try {
    const profile = await ProfileService.getProfile(userId);
    if (profile?.student) {
      semester = profile.student.semester || 6;
      departmentId = "dept-comp";
      divisionId = "div-comp-a";
    } else if (profile?.faculty) {
      departmentId = "dept-comp";
    }
  } catch {
    if (role === Role.STUDENT || role === "STUDENT") {
      departmentId = "dept-comp";
      divisionId = "div-comp-a";
      semester = 6;
    } else if (role === Role.FACULTY || role === "FACULTY") {
      departmentId = "dept-comp";
    }
  }

  return { departmentId, divisionId, semester };
}

/**
 * GET /api/notices/unread-count
 * Fast endpoint for notification bells, omnibars, and sidebar badges.
 */
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { departmentId, divisionId, semester } = await resolveUserContext(user.id, user.role);

    const unreadCount = await NoticeService.getUnreadCount(
      user.id,
      user.role,
      departmentId,
      divisionId,
      semester
    );

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve unread count.";
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status: 500 });
  }
}
