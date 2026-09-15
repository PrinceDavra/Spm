import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/services/analytics.service";
import {
  ReportTypeEnum,
  analyticsFilterSchema,
} from "@/validators/analytics.schema";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ report: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { report: rawReport } = await context.params;
    const reportParse = ReportTypeEnum.safeParse(rawReport);
    if (!reportParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Report Type",
          message: `Unknown report: '${rawReport}'. Valid reports: ${ReportTypeEnum.options.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const reportType = reportParse.data;
    const url = new URL(req.url);
    const filterParse = analyticsFilterSchema.safeParse({
      departmentId: url.searchParams.get("departmentId") || undefined,
      semester: url.searchParams.get("semester") || undefined,
      divisionId: url.searchParams.get("divisionId") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    });

    const filters = filterParse.success ? filterParse.data : undefined;

    const { filename, csv } = await AnalyticsService.exportReport(
      reportType,
      filters || {},
      user.role,
      user.id
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export report";
    const statusCode = message.includes("Security Violation") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}
