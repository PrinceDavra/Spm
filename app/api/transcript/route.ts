import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedStudentId = searchParams.get("studentId");

  let targetStudentId = session.id;

  // Strict IDOR protection
  if (session.role === Role.STUDENT) {
    if (requestedStudentId && requestedStudentId !== session.id && requestedStudentId !== "demo-student-001") {
      return NextResponse.json({ error: "Forbidden: Cannot access academic transcript of another student" }, { status: 403 });
    }
    targetStudentId = session.id;
  } else if (requestedStudentId) {
    targetStudentId = requestedStudentId;
  }

  try {
    const transcript = await ExamService.getAcademicTranscript(targetStudentId);
    return NextResponse.json({ transcript });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate academic transcript" }, { status: 500 });
  }
}
