import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";
import { markNotificationReadSchema } from "@/validators/notification.schema";

/**
 * PATCH /api/notifications/[id]
 * Toggle read / unread status of a notification (strictly verifying ownership).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = markNotificationReadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { isRead } = parseResult.data;
    const updated = isRead
      ? await NotificationService.markAsRead(id, user.id)
      : await NotificationService.markAsUnread(id, user.id);

    return NextResponse.json({ success: true, notification: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update notification status";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Dismiss/delete a notification for the authenticated user.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    await NotificationService.deleteNotification(id, user.id);

    return NextResponse.json({ success: true, message: "Notification dismissed successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete notification";
    const status = message.includes("unauthorized") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
