import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role, ExamStatus } from "@prisma/client";
import { ExamService } from "@/services/exam.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN && session.role !== Role.FACULTY) {
    return NextResponse.json({ error: "Forbidden: Only administrators or faculty can complete exams" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const updated = await ExamService.updateExam(id, { status: ExamStatus.COMPLETED }, session.id);
    return NextResponse.json({ exam: updated, message: "Exam marked as completed" });
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Failed to complete exam" }, { status });
  }
}
