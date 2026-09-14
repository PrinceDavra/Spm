import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ClubService } from "@/services/club.service";
import { updateMembershipSchema } from "@/validators/club.schema";

/**
 * PATCH /api/clubs/[id]/members/[membershipId]
 * Promote or adjust role for a member.
 */
export async function PATCH(
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
    const body = await req.json();
    const parseResult = updateMembershipSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation Error", message: "Invalid role or status specified" },
        { status: 400 }
      );
    }

    if (!parseResult.data.role) {
      return NextResponse.json(
        { success: false, error: "Validation Error", message: "Role must be specified" },
        { status: 400 }
      );
    }

    const updated = await ClubService.updateMemberRole(
      id,
      membershipId,
      parseResult.data.role,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: `Role for ${updated.userName} updated to ${updated.role}.`,
      membership: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update member role";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/clubs/[id]/members/[membershipId]
 * Remove a member from the club.
 */
export async function DELETE(
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
    const removed = await ClubService.removeMember(
      id,
      membershipId,
      user.id,
      user.role
    );

    return NextResponse.json({
      success: true,
      message: `Member ${removed.userName} removed from the club.`,
      membership: removed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove member";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
