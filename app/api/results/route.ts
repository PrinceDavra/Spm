import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { DEMO_EXAM_RESULTS_STORE } from "@/lib/exam/demo-exams";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const semesterStr = searchParams.get("semester");
  const studentId = searchParams.get("studentId");
  const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;

  let results = [...DEMO_EXAM_RESULTS_STORE];

  if (session.role === Role.STUDENT) {
    // IDOR protection: Student can only see their own results
    results = results.filter((r) => r.studentId === session.id || r.studentId === "demo-student-001");
    // Ensure only PUBLISHED or LOCKED results are visible to students
    results = results.filter((r) => r.status === "PUBLISHED" || r.status === "LOCKED");
  } else if (studentId) {
    results = results.filter((r) => r.studentId === studentId);
  }

  if (semester) {
    results = results.filter((r) => r.semesterNumber === semester);
  }

  return NextResponse.json({ results });
}
