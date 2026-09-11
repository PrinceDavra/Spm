import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only faculty and administrators can view assignment analytics." },
        { status: 403 }
      );
    }

    const analytics = await AssignmentService.getFacultyAnalytics(user.id, user.role);

    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve analytics.";
    return NextResponse.json({ success: false, error: "Analytics Error", message }, { status: 500 });
  }
}
