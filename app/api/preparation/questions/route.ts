import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { createQuestionSchema } from "@/validators/placement.schema";
import { PrepCategory, QuestionDifficulty, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/preparation/questions
 * Browse question bank. Students receive questions WITHOUT answers. Officers see full keys.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") as PrepCategory) || undefined;
    const difficulty = (searchParams.get("difficulty") as QuestionDifficulty) || undefined;
    const topic = searchParams.get("topic") || undefined;
    const search = searchParams.get("search") || undefined;

    const questions = await QuizService.getQuestions({
      category,
      difficulty,
      topic,
      search,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch questions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/preparation/questions
 * Add question to the repository (PLACEMENT_OFFICER, ADMIN only).
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const parseResult = createQuestionSchema.safeParse(body);

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

    const question = await QuizService.createQuestion(parseResult.data, user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Question added to preparation repository.",
        question,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create question";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
