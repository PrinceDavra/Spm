import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { updateQuestionSchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/preparation/questions/[id]
 * View individual question.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const questions = await QuizService.getQuestions({ userRole: user.role });
    const question = questions.find((q) => q.id === id);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, question });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/preparation/questions/[id]
 * Update question details (PLACEMENT_OFFICER, ADMIN only).
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
    const parseResult = updateQuestionSchema.safeParse(body);

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

    const updated = await QuizService.updateQuestion(id, parseResult.data, user.id);
    return NextResponse.json({
      success: true,
      message: "Question updated successfully.",
      question: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update question";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
