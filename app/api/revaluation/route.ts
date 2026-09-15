import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role, RevaluationStatus } from "@prisma/client";
import { ExamService } from "@/services/exam.service";
import { revaluationRequestSchema } from "@/validators/exam.schema";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const examId = searchParams.get("examId") || undefined;
  const status = statusParam ? (statusParam as RevaluationStatus) : undefined;

  try {
    const requests = await ExamService.getRevaluationRequests(
      { status, examId },
      session.id,
      session.role
    );
    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve revaluation requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.STUDENT && session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden: Only students can request revaluation" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = revaluationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const revaluation = await ExamService.submitRevaluationRequest(session.id, parsed.data);
    return NextResponse.json({ revaluation }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Failed to submit revaluation request" }, { status });
  }
}
