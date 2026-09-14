import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";
import { Role } from "@prisma/client";

/**
 * GET /api/preparation/my-progress
 * Returns student placement readiness index and historical preparation progress.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    let targetUserId = user.id;

    if (user.role !== Role.STUDENT) {
      const studentIdParam = searchParams.get("studentId");
      if (studentIdParam) {
        targetUserId = studentIdParam;
      }
    }

    const readiness = await QuizService.getStudentReadinessScore(targetUserId);

    return NextResponse.json({
      success: true,
      readiness,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch student preparation progress";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
