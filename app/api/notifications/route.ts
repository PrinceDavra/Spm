import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";

/**
 * GET /api/notifications
 * Retrieve notifications for the authenticated user.
 */
export async function GET() {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const notifications = await NotificationService.getUserNotifications(user.id);
    return NextResponse.json({ success: true, notifications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
