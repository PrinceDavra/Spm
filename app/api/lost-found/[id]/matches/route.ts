import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * GET /api/lost-found/[id]/matches
 * Returns deterministic potential matches computed by the matching engine.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await checkAuth();

    const reportData = await LostFoundService.getReportById(id, user?.id, user?.role);
    if (!reportData) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const matches = LostFoundService.findMatchesForItem(reportData.item);

    return NextResponse.json({
      success: true,
      item: {
        id: reportData.item.id,
        title: reportData.item.title,
        type: reportData.item.type,
      },
      matches,
      disclaimer: "Potential match scores are institutional suggestions and do not constitute proof of ownership.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate potential matches";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
