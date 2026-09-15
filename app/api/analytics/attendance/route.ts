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
    const parseResult = analyticsFilterSchema.safeParse({
      departmentId: url.searchParams.get("departmentId") || undefined,
      programId: url.searchParams.get("programId") || undefined,
      batchId: url.searchParams.get("batchId") || undefined,
      semester: url.searchParams.get("semester") || undefined,
      divisionId: url.searchParams.get("divisionId") || undefined,
      subjectId: url.searchParams.get("subjectId") || undefined,
      facultyId: url.searchParams.get("facultyId") || undefined,
      dateRange: url.searchParams.get("dateRange") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    });

    const filters = parseResult.success ? parseResult.data : undefined;
    const analytics = await AnalyticsService.getAttendanceAnalytics(filters);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch attendance analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
