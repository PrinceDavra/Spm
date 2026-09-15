import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";

/**
 * GET /api/notifications/unread-count
 * Fast indexed lookup for unread notifications count for badge display.
 */
export async function GET() {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const unreadCount = await NotificationService.getUnreadCount(user.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch unread count";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
