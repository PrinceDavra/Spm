import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { Role } from "@prisma/client";

/**
 * POST /api/clubs/[id]/publish
 * Transitions club from DRAFT to ACTIVE (Admin only).
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

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only administrators can publish student organizations" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const publishedClub = await ClubService.publishClub(id, user.id);

    return NextResponse.json({
      success: true,
      message: `Club "${publishedClub.name}" published successfully and is now active.`,
      club: publishedClub,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish club";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
