import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * POST /api/lost-found/[id]/publish
 * Transition report from DRAFT to PUBLISHED.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const item = await LostFoundService.publishReport(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Report published successfully to the campus community feed!",
      item,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish report";
    let status = 400;
    if (message.includes("Forbidden") || message.includes("Unauthorized") || message.includes("permission")) {
      status = 403;
    }
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
