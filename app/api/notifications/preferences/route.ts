import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { NotificationService } from "@/services/notification.service";
import { updateNotificationPreferencesSchema } from "@/validators/notification.schema";

/**
 * GET /api/notifications/preferences
 * Retrieve the current user's notification preferences across all categories.
 */
export async function GET() {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const preferences = await NotificationService.getUserPreferences(user.id);
    return NextResponse.json({
      success: true,
      preferences,
      note: "Email notification delivery is currently unconfigured/simulated on this campus node.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve preferences";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the authenticated user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const parseResult = updateNotificationPreferencesSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await NotificationService.updateUserPreferences(
      user.id,
      parseResult.data.preferences
    );

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "Notification preferences saved successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update preferences";
    const status = message.includes("Critical") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
