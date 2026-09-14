import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { createClubSchema } from "@/validators/club.schema";
import { ClubCategory, ClubStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/clubs
 * Discovery feed for campus clubs with search, category, and sort filters.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = (searchParams.get("category") as ClubCategory) || undefined;
    const status = (searchParams.get("status") as ClubStatus) || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const membershipStatus = (searchParams.get("membershipStatus") as any) || undefined;
    const sort = (searchParams.get("sort") as any) || "most_members";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const { clubs, total } = await ClubService.getClubs({
      userId: user.id,
      role: user.role,
      search,
      category,
      status,
      departmentId,
      membershipStatus,
      sort,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      clubs,
      total,
      limit,
      offset,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch clubs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/clubs
 * Create a new club (Admin only).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only administrators can create new student organizations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = createClubSchema.safeParse(body);

    if (!parseResult.success) {
      const error = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newClub = await ClubService.createClub(parseResult.data, user.id);

    return NextResponse.json(
      {
        success: true,
        message: `Club "${newClub.name}" created successfully.`,
        club: newClub,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create club";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
