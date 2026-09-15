import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * GET /api/lost-found/analytics
 * Retrieve institutional recovery metrics, category distribution, and hotspot analytics.
 */
export async function GET() {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const analytics = await LostFoundService.getAnalytics(user.role, user.id);
    return NextResponse.json({ success: true, analytics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
