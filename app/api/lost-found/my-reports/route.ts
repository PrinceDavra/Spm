import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * GET /api/lost-found/my-reports
 * Returns all reports created by the currently authenticated user (including drafts).
 */
export async function GET() {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const reports = await LostFoundService.getMyReports(user.id);
    return NextResponse.json({ success: true, reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user reports";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
