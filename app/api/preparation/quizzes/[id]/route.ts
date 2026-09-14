import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { updateQuizSchema } from "@/validators/placement.schema";
import { QuizStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/preparation/quizzes/[id]
 * Fetch quiz details. Questions for students do NOT contain answer keys or explanations.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const quiz = await QuizService.getQuizById(id, user.role);

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Role check: Students cannot access unpublished quizzes
    if (user.role === Role.STUDENT && quiz.status === QuizStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: "Forbidden: This quiz is not published yet" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, quiz });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch quiz";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/preparation/quizzes/[id]
 * Update quiz metadata or publish/archive (PLACEMENT_OFFICER, ADMIN only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parseResult = updateQuizSchema.safeParse(body);

    if (!parseResult.success) {
      const zodError = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: zodError.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await QuizService.updateQuiz(id, parseResult.data, user.id);
    return NextResponse.json({
      success: true,
      message: "Quiz updated successfully.",
      quiz: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quiz";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
