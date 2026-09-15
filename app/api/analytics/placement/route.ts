import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";
import { analyticsFilterSchema } from "@/validators/analytics.schema";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.ADMIN, Role.PLACEMENT_OFFICER]);
    if (error) return error;

    const url = new URL(req.url);
    const parseResult = analyticsFilterSchema.safeParse({
      departmentId: url.searchParams.get("departmentId") || undefined,
    });

    const filters = parseResult.success ? parseResult.data : undefined;
    const analytics = await AnalyticsService.getPlacementAnalytics(filters);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch placement analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
