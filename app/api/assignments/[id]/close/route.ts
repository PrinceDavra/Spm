import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { Role } from "@prisma/client";

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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and administrators can close assignments." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const assignment = await AssignmentService.closeAssignment(user.id, user.role, id);

    return NextResponse.json({
      success: true,
      message: `Assignment "${assignment.title}" has been closed.`,
      assignment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to close assignment.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;
    return NextResponse.json({ success: false, error: "Close Error", message }, { status });
  }
}
