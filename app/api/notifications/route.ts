import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";
import { notificationFilterSchema } from "@/validators/notification.schema";

/**
 * GET /api/notifications
 * Retrieve notifications for the authenticated user with filters, search, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const url = new URL(req.url);
    const parseResult = notificationFilterSchema.safeParse({
      type: url.searchParams.get("type") || undefined,
      priority: url.searchParams.get("priority") || undefined,
      isRead: url.searchParams.get("isRead") ?? undefined,
      search: url.searchParams.get("search") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const filters = parseResult.data;
    const allMatching = await NotificationService.getUserNotifications(user.id, {
      type: filters.type,
      priority: filters.priority,
      isRead: filters.isRead,
      search: filters.search,
    });

    const paginated = await NotificationService.getUserNotifications(user.id, filters);
    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      notifications: paginated,
      total: allMatching.length,
      unreadCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
