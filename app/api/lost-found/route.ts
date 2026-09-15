import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { createReportSchema } from "@/validators/lost-found.schema";
import { LostFoundType, LostFoundCategory, LostFoundStatus } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/lost-found
 * Public feed for discovering lost and found campus belongings.
 * Draft reports are automatically filtered out for non-owners/non-admins.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") as LostFoundType | null;
    const categoryParam = searchParams.get("category") as LostFoundCategory | null;
    const statusParam = searchParams.get("status") as LostFoundStatus | null;
    const locationParam = searchParams.get("location");
    const searchParam = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { user } = await checkAuth();

    const { items, total } = await LostFoundService.getReports({
      type: typeParam || undefined,
      category: categoryParam || undefined,
      status: statusParam || undefined,
      location: locationParam || undefined,
      search: searchParam || undefined,
      userId: user?.id,
      role: user?.role,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, items, total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve reports";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/lost-found
 * Submit a new lost or found item report.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const parseResult = createReportSchema.safeParse(body);

    if (!parseResult.success) {
      const zodError = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: zodError.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const item = await LostFoundService.createReport(
      parseResult.data,
      user.id,
      user.role
    );

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create report";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
