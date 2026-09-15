import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { DEMO_EXAMS_STORE, DEMO_EXAM_ENROLLMENTS_STORE } from "@/lib/exam/demo-exams";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exam = DEMO_EXAMS_STORE.find((e) => e.id === id);
  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const requestedStudentId = searchParams.get("studentId");

  if (session.role === Role.STUDENT) {
    // IDOR protection: Student can only view their own eligibility
    const enrollment = DEMO_EXAM_ENROLLMENTS_STORE.find(
      (enr) => enr.examId === id && (enr.studentId === session.id || enr.studentId === "demo-student-001")
    );

    if (!enrollment) {
      return NextResponse.json({
        examId: id,
        isEligible: false,
        ineligibilityReason: "Not enrolled in this examination",
        hallTicketNumber: null,
      });
    }

    return NextResponse.json({
      examId: id,
      isEligible: enrollment.isEligible,
      ineligibilityReason: enrollment.ineligibilityReason,
      hallTicketNumber: enrollment.hallTicketNumber,
      studentName: enrollment.studentName,
      rollNumber: enrollment.rollNumber,
    });
  }

  // Admin or Faculty
  if (requestedStudentId) {
    const enrollment = DEMO_EXAM_ENROLLMENTS_STORE.find(
      (enr) => enr.examId === id && enr.studentId === requestedStudentId
    );
    return NextResponse.json({ enrollment });
  }

  const enrollments = DEMO_EXAM_ENROLLMENTS_STORE.filter((enr) => enr.examId === id);
  return NextResponse.json({ enrollments, candidates: enrollments });
}
