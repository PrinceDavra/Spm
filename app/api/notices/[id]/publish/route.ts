import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { Role } from "@prisma/client";

/**
 * POST /api/notices/[id]/publish
 * Transitions a DRAFT notice to PUBLISHED and broadcasts notifications.
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

    if (user.role === Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Students cannot publish notices." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const published = await NoticeService.publishNotice(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Notice published successfully.",
      notice: published,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish notice.";
    if (message.includes("not found")) {
      return NextResponse.json({ success: false, error: "Not Found", message }, { status: 404 });
    }
    if (message.includes("Unauthorized") || message.includes("Only the author")) {
      return NextResponse.json({ success: false, error: "Forbidden", message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status: 400 });
  }
}
