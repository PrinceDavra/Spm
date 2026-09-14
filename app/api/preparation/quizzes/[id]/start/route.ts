import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { Role } from "@prisma/client";

/**
 * POST /api/preparation/quizzes/[id]/start
 * Start a server-timed quiz attempt. Answer keys are strictly hidden from payload.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.STUDENT]);
    if (error) return error;

    const { id: quizId } = await params;
    const attempt = await QuizService.startAttempt(quizId, user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Quiz attempt started. Good luck!",
        attempt,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start quiz attempt";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
