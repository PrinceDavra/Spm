import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";
import { scheduleExamSchema } from "@/validators/exam.schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden: Only administrators can schedule exams" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = scheduleExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const scheduled = await ExamService.scheduleExam(id, parsed.data, session.id);
    return NextResponse.json({ exam: scheduled });
  } catch (error: any) {
    const isConflict =
      error.message?.includes("collision") ||
      error.message?.includes("conflict") ||
      error.message?.includes("clash") ||
      error.message?.includes("already booked");
    const status = isConflict ? 409 : error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Failed to schedule exam" }, { status });
  }
}
