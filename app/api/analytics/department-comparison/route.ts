import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.ADMIN]);
    if (error) return error;

    const comparison = await AnalyticsService.getDepartmentComparison();

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch department comparison";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
