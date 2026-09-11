import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { Role } from "@prisma/client";

/**
 * GET /api/notices/analytics
 * Retrieve high-level institutional and audience reach metrics.
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

    if (user.role === Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Notice analytics are reserved for faculty and administrators." },
        { status: 403 }
      );
    }

    const analytics = await NoticeService.getNoticeAnalytics(user.id, user.role);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics.";
    return NextResponse.json({ success: false, error: "Analytics Error", message }, { status: 500 });
  }
}
