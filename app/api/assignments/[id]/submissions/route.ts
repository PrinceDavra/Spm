import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { Role } from "@prisma/client";

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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and administrators can access the submission roster." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await AssignmentService.getAssignmentSubmissions(
      user.id,
      user.role,
      id,
      filterStatus,
      search
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve submission roster.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: "Roster Error", message }, { status });
  }
}
