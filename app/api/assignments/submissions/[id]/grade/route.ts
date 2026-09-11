import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";
import { gradeSubmissionSchema } from "@/validators/assignment.schema";
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

    if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only faculty and administrators can grade submissions." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = gradeSubmissionSchema.parse(body);

    const gradedSubmission = await AssignmentService.gradeSubmission(
      user.id,
      user.role,
      id,
      validatedData
    );

    return NextResponse.json({
      success: true,
      message: "Submission successfully evaluated and grade published.",
      submission: gradedSubmission,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to grade submission.";
    const status = message.includes("Security Violation")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;
    return NextResponse.json({ success: false, error: "Grading Error", message }, { status });
  }
}
