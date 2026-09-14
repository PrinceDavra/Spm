import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { createActivitySchema } from "@/validators/club.schema";
import { ZodError } from "zod";

/**
 * GET /api/clubs/[id]/activities
 * Retrieve club activities list.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const club = await ClubService.getClubById(id, user.id, user.role);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: "Club not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clubId: club.id,
      activities: club.activities,
      total: club.activities.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch activities";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/clubs/[id]/activities
 * Create a new club activity (Coordinator / Advisor / Admin).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parseResult = createActivitySchema.safeParse(body);

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

    const activity = await ClubService.createActivity(
      id,
      parseResult.data,
      user.id,
      user.role
    );

    return NextResponse.json(
      {
        success: true,
        message: `Activity "${activity.title}" scheduled successfully.`,
        activity,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create activity";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
