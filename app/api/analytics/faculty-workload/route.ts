import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";
import { analyticsFilterSchema } from "@/validators/analytics.schema";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.ADMIN, Role.FACULTY]);
    if (error) return error;

    const url = new URL(req.url);
    const facultyIdParam = url.searchParams.get("facultyId") || undefined;

    // Zero-trust authorization: FACULTY role can only query their own workload
    if (user.role === Role.FACULTY && facultyIdParam && facultyIdParam !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Faculty members are only permitted to query their own workload analytics.",
        },
        { status: 403 }
      );
    }

    const targetFacultyId = user.role === Role.FACULTY ? user.id : facultyIdParam;

    const parseResult = analyticsFilterSchema.safeParse({
      departmentId: url.searchParams.get("departmentId") || undefined,
      facultyId: targetFacultyId,
    });

    const filters = parseResult.success ? parseResult.data : undefined;
    const workload = await AnalyticsService.getFacultyWorkloadAnalytics(filters);

    return NextResponse.json({
      success: true,
      workload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch faculty workload analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
