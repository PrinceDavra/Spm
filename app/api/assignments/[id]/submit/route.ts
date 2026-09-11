import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { submitAssignmentSchema } from "@/validators/assignment.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

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

    if (user.role !== Role.STUDENT && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only students can submit assignments." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = submitAssignmentSchema.parse(body);

    const submission = await AssignmentService.submitAssignment(user.id, id, validatedData);

    return NextResponse.json({
      success: true,
      message: submission.isLate
        ? `Submission recorded (LATE - ${submission.latePenaltyApplied}% deduction applied).`
        : "Assignment successfully submitted on time.",
      submission,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to submit assignment.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("Deadline has passed") || message.includes("closed")
      ? 400
      : message.includes("not found")
      ? 404
      : 400;

    return NextResponse.json({ success: false, error: "Submission Error", message }, { status });
  }
}
