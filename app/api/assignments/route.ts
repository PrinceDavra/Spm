import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { createAssignmentSchema } from "@/validators/assignment.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

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
    const subjectId = searchParams.get("subjectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    if (user.role === Role.STUDENT) {
      const result = await AssignmentService.getStudentAssignments(user.id, {
        subjectId,
        status,
        search,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (user.role === Role.FACULTY || user.role === Role.ADMIN) {
      const assignments = await AssignmentService.getFacultyAssignments(user.id, user.role);
      return NextResponse.json({ success: true, assignments });
    }

    return NextResponse.json(
      { success: false, error: "Forbidden", message: "Insufficient privileges to access assignments." },
      { status: 403 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve assignments.";
    return NextResponse.json({ success: false, error: "Assignment Error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only faculty and administrators can create assignments." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createAssignmentSchema.parse(body);

    const assignment = await AssignmentService.createAssignment(user.id, user.role, validatedData);

    return NextResponse.json({
      success: true,
      message: `Assignment "${assignment.title}" successfully created.`,
      assignment,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to create assignment.";
    const status = message.includes("Security Violation") ? 403 : 400;
    return NextResponse.json({ success: false, error: "Assignment Error", message }, { status });
  }
}
