import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";

/**
 * POST /api/clubs/[id]/members/[membershipId]/approve
 * Approves a pending club membership application.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { id, membershipId } = await params;
    const approvedMember = await ClubService.approveMembership(
      id,
      membershipId,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: `Membership application for ${approvedMember.userName} approved successfully.`,
      membership: approvedMember,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve membership";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
