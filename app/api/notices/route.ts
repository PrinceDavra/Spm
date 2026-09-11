import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { ProfileService } from "@/services/profile.service";
import { createNoticeSchema } from "@/validators/notice.schema";
import { Role, NoticeCategory, NoticePriority, NoticeStatus } from "@prisma/client";
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
 * GET /api/notices
 * Retrieves notice feed scoped to the caller's role, audience permissions, and search/filter parameters.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required to access notice board." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") as NoticeCategory) || undefined;
    const priority = (searchParams.get("priority") as NoticePriority) || undefined;
    const status = (searchParams.get("status") as NoticeStatus) || undefined;
    const search = searchParams.get("search") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const { departmentId, divisionId, semester } = await resolveUserContext(user.id, user.role);

    const result = await NoticeService.getNotices({
      userId: user.id,
      role: user.role,
      departmentId,
      divisionId,
      semester,
      category,
      priority,
      status,
      search,
      limit,
      offset,
      includeArchived,
    });

    const unreadCount = await NoticeService.getUnreadCount(
      user.id,
      user.role,
      departmentId,
      divisionId,
      semester
    );

    return NextResponse.json({
      success: true,
      notices: result.notices,
      totalCount: result.totalCount,
      unreadCount,
      hasMore: result.hasMore,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve notices.";
    return NextResponse.json(
      { success: false, error: "Notice Error", message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notices
 * Author a new institutional notice (ADMIN or FACULTY).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required to create notices." },
        { status: 401 }
      );
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Students are not permitted to publish notices." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createNoticeSchema.parse(body);

    const { departmentId } = await resolveUserContext(user.id, user.role);

    const notice = await NoticeService.createNotice(
      {
        id: user.id,
        role: user.role,
        firstName: user.firstName || "Institutional",
        lastName: user.lastName || "Publisher",
        departmentId,
      },
      validated
    );

    return NextResponse.json(
      {
        success: true,
        message: notice.status === NoticeStatus.DRAFT ? "Draft notice saved successfully." : "Notice published successfully.",
        notice,
      },
      { status: 201 }
    );
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

    const message = error instanceof Error ? error.message : "Failed to create notice.";
    const status = message.includes("Unauthorized") || message.includes("not permitted") || message.includes("cannot target") ? 403 : 500;
    return NextResponse.json({ success: false, error: "Notice Error", message }, { status });
  }
}
