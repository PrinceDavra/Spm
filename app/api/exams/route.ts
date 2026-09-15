import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";
import { createExamSchema, examFilterSchema } from "@/validators/exam.schema";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawParams = {
    departmentId: searchParams.get("departmentId") || undefined,
    semesterNumber: searchParams.get("semesterNumber") || undefined,
    divisionId: searchParams.get("divisionId") || undefined,
    subjectId: searchParams.get("subjectId") || undefined,
    facultyId: searchParams.get("facultyId") || undefined,
    status: searchParams.get("status") || undefined,
    examType: searchParams.get("examType") || undefined,
    academicYear: searchParams.get("academicYear") || undefined,
    date: searchParams.get("date") || undefined,
  };

  const parsed = examFilterSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filter parameters", details: parsed.error.format() }, { status: 400 });
  }

  try {
    const exams = await ExamService.getExams(parsed.data, session.id, session.role);
    return NextResponse.json({ exams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve exams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden: Only administrators can create exams" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const exam = await ExamService.createExam(parsed.data, session.id);
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("collision") || error.message?.includes("conflict") ? 409 : 400;
    return NextResponse.json({ error: error.message || "Failed to create exam" }, { status });
  }
}
