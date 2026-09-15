import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";
import { reviewRevaluationSchema } from "@/validators/exam.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN && session.role !== Role.FACULTY) {
    return NextResponse.json({ error: "Forbidden: Only administrators or faculty can review revaluation requests" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = reviewRevaluationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const reviewed = await ExamService.reviewRevaluationRequest(
      id,
      parsed.data,
      session.id,
      session.role
    );
    return NextResponse.json({ revaluation: reviewed });
  } catch (error: any) {
    const status = error.message?.includes("cannot review your own")
      ? 403
      : error.message?.includes("not found")
      ? 404
      : 400;
    return NextResponse.json({ error: error.message || "Failed to review revaluation request" }, { status });
  }
}
