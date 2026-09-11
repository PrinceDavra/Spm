import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { updateAssignmentSchema } from "@/validators/assignment.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

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
    const details = await AssignmentService.getAssignmentDetails(user.id, user.role, id);

    return NextResponse.json({ success: true, ...details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve assignment details.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: "Assignment Error", message }, { status });
  }
}

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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and administrators can update assignments." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateAssignmentSchema.parse(body);

    const updated = await AssignmentService.updateAssignment(user.id, user.role, id, validatedData);

    return NextResponse.json({
      success: true,
      message: "Assignment successfully updated.",
      assignment: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update assignment.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;
    return NextResponse.json({ success: false, error: "Assignment Error", message }, { status });
  }
}
