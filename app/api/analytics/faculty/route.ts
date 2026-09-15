import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.FACULTY, Role.ADMIN]);
    if (error) return error;

    const url = new URL(req.url);
    const queryFacultyId = url.searchParams.get("facultyId");

    // Zero-trust IDOR Protection: Faculty can ONLY view their own teaching analytics
    if (user.role === Role.FACULTY && queryFacultyId && queryFacultyId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Faculty members are strictly prohibited from accessing peer teaching analytics.",
        },
        { status: 403 }
      );
    }

    const targetFacultyId = user.role === Role.FACULTY ? user.id : queryFacultyId || user.id;
    const analytics = await AnalyticsService.getFacultyAnalytics(targetFacultyId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch faculty teaching analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
