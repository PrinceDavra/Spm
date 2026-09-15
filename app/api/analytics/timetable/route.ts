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
      divisionId: url.searchParams.get("divisionId") || undefined,
      semester: url.searchParams.get("semester") || undefined,
    });

    const filters = parseResult.success ? parseResult.data : undefined;
    const utilization = await AnalyticsService.getTimetableUtilization(filters);

    return NextResponse.json({
      success: true,
      utilization,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch timetable utilization";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
