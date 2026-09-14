import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { QuizService } from "@/services/quiz.service";

/**
 * GET /api/preparation/categories
 * List available preparation topic categories with question and quiz counts.
 */
export async function GET(_req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const categories = await QuizService.getCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch preparation categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
