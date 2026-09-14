import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { Role } from "@prisma/client";

/**
 * GET /api/preparation/attempts/[id]
 * Fetch attempt status, answers, and detailed question review if completed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id: attemptId } = await params;
    const attempt = await QuizService.getAttemptResult(attemptId);

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Role check: Students can only view their own attempts
    if (user.role === Role.STUDENT && attempt.student.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot access another student's quiz attempt" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve attempt";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
