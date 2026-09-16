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
  const semesterStr = searchParams.get("semester");
  const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;

  let targetStudentId = session.id;

  // Enforce zero-trust IDOR security and server-side RBAC
  if (session.role === Role.STUDENT) {
    if (requestedStudentId && requestedStudentId !== session.id && requestedStudentId !== "demo-student-001") {
      return NextResponse.json({ error: "Forbidden: Cannot access academic results of another student" }, { status: 403 });
    }
    targetStudentId = session.id;
  } else if (session.role === Role.ADMIN || session.role === Role.FACULTY) {
    if (requestedStudentId) {
      targetStudentId = requestedStudentId;
    }
  } else {
    return NextResponse.json({ error: "Forbidden: Insufficient privileges to access academic results" }, { status: 403 });
  }

  try {
    const resultsData = await ExamService.getStudentResults(targetStudentId, semester);
    return NextResponse.json({ ...resultsData, results: resultsData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve student results" }, { status: 500 });
  }
}
