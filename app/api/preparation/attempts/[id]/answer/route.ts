import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { recordAnswerSchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * POST /api/preparation/attempts/[id]/answer
 * Save question response with server-side timer validation and auto-submit on expiration.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.STUDENT]);
    if (error) return error;

    const { id: attemptId } = await params;
    const body = await req.json();
    const parseResult = recordAnswerSchema.safeParse(body);

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

    const { questionId, selectedOptionIndex } = parseResult.data;
    const result = await QuizService.recordAnswer(
      attemptId,
      user.id,
      questionId,
      selectedOptionIndex
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record answer";
    let status = 400;
    if (message.includes("not found")) status = 404;
    if (message.includes("Unauthorized") || message.includes("Forbidden")) status = 403;
    if (message.includes("expired")) status = 410; // Gone / expired
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
