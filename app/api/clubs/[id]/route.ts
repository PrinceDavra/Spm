import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { updateClubSchema } from "@/validators/club.schema";
import { ZodError } from "zod";

/**
 * GET /api/clubs/[id]
 * Fetch detailed club profile with active members, activities, and linked events.
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

    return NextResponse.json({ success: true, club });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch club details";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/clubs/[id]
 * Update club profile (Coordinator / Faculty Advisor / Admin).
 */
export async function PATCH(
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
    const parseResult = updateClubSchema.safeParse(body);

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

    const updatedClub = await ClubService.updateClub(id, parseResult.data, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: `Club "${updatedClub.name}" updated successfully.`,
      club: updatedClub,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update club";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
