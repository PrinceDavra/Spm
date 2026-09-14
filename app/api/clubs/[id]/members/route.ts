import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { Role } from "@prisma/client";

/**
 * GET /api/clubs/[id]/members
 * Retrieve complete member roster and pending join requests (Coordinator / Advisor / Admin only).
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

    // Security Authorization: Only Coordinator, Faculty Advisor, or Admin
    if (!club.isCoordinator && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "You are not authorized to view the management roster for this club" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      clubId: club.id,
      clubName: club.name,
      activeMembers: club.activeMembers,
      members: club.activeMembers,
      pendingMembers: club.pendingMembers,
      pending: club.pendingMembers,
      totalActive: club.activeMembers.length,
      totalPending: club.pendingMembers.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch member roster";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
