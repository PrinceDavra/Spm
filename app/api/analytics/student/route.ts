import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.STUDENT, Role.ADMIN]);
    if (error) return error;

    const url = new URL(req.url);
    const queryStudentId = url.searchParams.get("studentId");

    // Zero-trust IDOR Protection: Students can ONLY view their own personal analytics
    if (user.role === Role.STUDENT && queryStudentId && queryStudentId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Students are strictly prohibited from accessing peer analytics records.",
        },
        { status: 403 }
      );
    }

    const targetStudentId = user.role === Role.STUDENT ? user.id : queryStudentId || user.id;
    const analytics = await AnalyticsService.getStudentAnalytics(targetStudentId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch student personal analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
