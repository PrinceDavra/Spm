import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";

/**
 * GET /api/notifications/smart-feed
 * Retrieve role-aware unified campus information feed.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const divisionId = url.searchParams.get("divisionId") || undefined;
    const semester = url.searchParams.get("semester")
      ? parseInt(url.searchParams.get("semester")!)
      : undefined;

    const feed = await NotificationService.getSmartFeed(user.id, user.role, {
      departmentId,
      divisionId,
      semester,
    });

    return NextResponse.json({
      success: true,
      ...feed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve smart feed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
