import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { Role } from "@prisma/client";

/**
 * POST /api/preparation/attempts/[id]/submit
 * Finalize and grade quiz attempt server-side. Reveals score, metrics, and explanations.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.STUDENT]);
    if (error) return error;

    const { id: attemptId } = await params;
    const result = await QuizService.submitAttempt(attemptId, user.id);

    return NextResponse.json({
      success: true,
      message: `Quiz submitted successfully! You scored ${result.score}/${result.totalMarks} (${result.percentage}%).`,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit attempt";
    let status = 400;
    if (message.includes("not found")) status = 404;
    if (message.includes("Unauthorized") || message.includes("Forbidden")) status = 403;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
