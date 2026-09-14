import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { createQuizSchema } from "@/validators/placement.schema";
import { PrepCategory, QuizStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/preparation/quizzes
 * List placement preparation quizzes with category and status filters.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") as PrepCategory) || undefined;
    const status = (searchParams.get("status") as QuizStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const quizzes = await QuizService.getQuizzes({
      category,
      status,
      search,
      userRole: user.role,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      quizzes,
      total: quizzes.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch quizzes";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/preparation/quizzes
 * Create a new timed quiz with curated questions (PLACEMENT_OFFICER, ADMIN only).
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const parseResult = createQuizSchema.safeParse(body);

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

    const quiz = await QuizService.createQuiz(parseResult.data, user.id);

    return NextResponse.json(
      {
        success: true,
        message: `Quiz "${quiz.title}" created successfully with ${quiz.questionCount} questions.`,
        quiz,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create quiz";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
