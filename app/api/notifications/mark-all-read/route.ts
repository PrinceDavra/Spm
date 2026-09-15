import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";
import { bulkMarkReadSchema } from "@/validators/notification.schema";

/**
 * POST /api/notifications/mark-all-read
 * Mark all (or specified subset of) notifications as read for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const parseResult = bulkMarkReadSchema.safeParse(body);
    const ids = parseResult.success ? parseResult.data.ids : undefined;

    const result = await NotificationService.markAllAsRead(user.id, ids);

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Marked ${result.count} notification(s) as read`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark all as read";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
