import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { QuizService } from "@/services/quiz.service";
import { Role } from "@prisma/client";

/**
 * GET /api/placements/analytics
 * Retrieve placement KPIs:
 * - PLACEMENT_OFFICER / ADMIN: Drive metrics, applications, shortlists, offers, conversion rate.
 * - STUDENT: Placement readiness index and personal application summary.
 */
export async function GET(_req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    if (user.role === Role.STUDENT) {
      const readiness = await QuizService.getStudentReadinessScore(user.id);
      const studentApps = await PlacementService.getApplications({
        studentUserId: user.id,
        userRole: user.role,
      });

      return NextResponse.json({
        success: true,
        type: "STUDENT_READINESS",
        readiness,
        applicationsCount: studentApps.length,
        activeApplications: studentApps.filter(
          (a) => !["REJECTED", "WITHDRAWN", "OFFERED"].includes(a.status)
        ).length,
      });
    }

    const analytics = await PlacementService.getPlacementAnalytics();
    return NextResponse.json({
      success: true,
      type: "OFFICER_OVERVIEW",
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch placement analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
