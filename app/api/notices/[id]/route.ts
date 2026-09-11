import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { ProfileService } from "@/services/profile.service";
import { updateNoticeSchema } from "@/validators/notice.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

async function resolveUserContext(userId: string, role: Role | string) {
  let departmentId: string | null = null;
  let divisionId: string | null = null;
  let semester: number | null = null;

  try {
    const profile = await ProfileService.getProfile(userId);
    if (profile?.student) {
      semester = profile.student.semester || 6;
      departmentId = "dept-comp";
      divisionId = "div-comp-a";
    } else if (profile?.faculty) {
      departmentId = "dept-comp";
    }
  } catch {
    if (role === Role.STUDENT || role === "STUDENT") {
      departmentId = "dept-comp";
      divisionId = "div-comp-a";
      semester = 6;
    } else if (role === Role.FACULTY || role === "FACULTY") {
      departmentId = "dept-comp";
    }
  }

  return { departmentId, divisionId, semester };
}

/**
 * GET /api/notices/[id]
 * Fetch notice details. Automatically marks as read if caller is a recipient.
 */
export async function GET(
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
    const { departmentId, divisionId, semester } = await resolveUserContext(user.id, user.role);

    const notice = await NoticeService.getNoticeById(id, {
      userId: user.id,
      role: user.role,
      departmentId,
      divisionId,
      semester,
    });

    return NextResponse.json({
      success: true,
      notice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notice.";
    if (message.includes("not found")) {
      return NextResponse.json({ success: false, error: "Not Found", message }, { status: 404 });
    }
    if (message.includes("Unauthorized") || message.includes("permission")) {
      return NextResponse.json({ success: false, error: "Forbidden", message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status: 500 });
  }
}

/**
 * PATCH /api/notices/[id]
 * Update notice content, metadata, or status.
 */
export async function PATCH(
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
        { success: false, error: "Forbidden", message: "Students cannot modify notices." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateNoticeSchema.parse(body);

    const updated = await NoticeService.updateNotice(id, user.id, user.role, validated);

    return NextResponse.json({
      success: true,
      message: "Notice updated successfully.",
      notice: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update notice.";
    if (message.includes("not found")) {
      return NextResponse.json({ success: false, error: "Not Found", message }, { status: 404 });
    }
    if (message.includes("Unauthorized") || message.includes("only edit notices you authored")) {
      return NextResponse.json({ success: false, error: "Forbidden", message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status: 500 });
  }
}
