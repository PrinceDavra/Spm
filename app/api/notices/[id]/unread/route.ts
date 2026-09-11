import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";

/**
 * POST /api/notices/[id]/unread
 * Toggles a notice back to unread state for the authenticated user.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const ok = await NoticeService.markAsUnread(id, user.id);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: "Notice not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notice marked as unread.",
      noticeId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notice unread.";
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status: 500 });
  }
}
