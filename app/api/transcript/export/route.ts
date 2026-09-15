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
  const format = searchParams.get("format") || "csv";

  let targetStudentId = session.id;

  // Strict IDOR protection
  if (session.role === Role.STUDENT) {
    if (requestedStudentId && requestedStudentId !== session.id && requestedStudentId !== "demo-student-001") {
      return NextResponse.json({ error: "Forbidden: Cannot export transcript of another student" }, { status: 403 });
    }
    targetStudentId = session.id;
  } else if (requestedStudentId) {
    targetStudentId = requestedStudentId;
  }

  try {
    const transcript = await ExamService.getAcademicTranscript(targetStudentId);

    if (format === "csv") {
      // Generate standard RFC 4180 CSV
      const rows: string[] = [];
      rows.push(`"OFFICIAL ACADEMIC TRANSCRIPT"`);
      rows.push(`"Institution","CampusSphere College of Engineering & Technology"`);
      rows.push(`"Student Name","${transcript.student.name}"`);
      rows.push(`"Roll Number","${transcript.student.rollNumber}"`);
      rows.push(`"PRN Number","${transcript.student.prnNumber}"`);
      rows.push(`"Program","${transcript.student.program}"`);
      rows.push(`"Department","${transcript.student.department}"`);
      rows.push(`"Batch","${transcript.student.batch}"`);
      rows.push(`"Cumulative CGPA","${transcript.summary.cumulativeCgpa}"`);
      rows.push(`"Degree Classification","${transcript.summary.degreeClassification}"`);
      rows.push(`"Reference Number","${transcript.summary.referenceNumber}"`);
      rows.push(`"Date Issued","${transcript.summary.issuedDate}"`);
      rows.push(""); // blank line
      rows.push(
        "Semester,Academic Year,Term,Subject Code,Subject Name,Credits,Max Marks,Marks Obtained,Percentage,Grade,Grade Point,Status"
      );

      for (const sem of transcript.semesters) {
        for (const sub of sem.subjects) {
          const status = sub.isAbsent ? "ABSENT" : sub.isPassed ? "PASS" : "FAIL";
          rows.push(
            [
              sem.semesterNumber,
              `"${sem.academicYear}"`,
              `"${sem.term}"`,
              `"${sub.subjectCode}"`,
              `"${sub.subjectName.replace(/"/g, '""')}"`,
              sub.credits,
              sub.maxMarks,
              sub.marksObtained,
              sub.percentage,
              `"${sub.gradeLetter}"`,
              sub.gradePoint,
              status,
            ].join(",")
          );
        }
        rows.push(
          `"Semester ${sem.semesterNumber} Summary",,"","","","GPA: ${sem.gpa}","Credits Attempted: ${sem.creditsAttempted}","Credits Earned: ${sem.creditsEarned}","","","",""`
        );
      }

      rows.push("");
      rows.push(
        `"TOTAL CREDITS ATTEMPTED",${transcript.summary.totalCreditsAttempted},"TOTAL CREDITS EARNED",${transcript.summary.totalCreditsEarned},"CUMULATIVE CGPA",${transcript.summary.cumulativeCgpa},"CLASSIFICATION","${transcript.summary.degreeClassification}"`
      );

      const csvContent = rows.join("\r\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="transcript-${transcript.student.rollNumber}.csv"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Default HTML / Printable view
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Academic Transcript — ${transcript.student.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; }
    .sem-block { margin-bottom: 24px; }
    .sem-title { font-size: 16px; font-weight: bold; background: #e2e8f0; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .summary-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 15px; }
    .summary-item { font-weight: bold; }
    @media print { body { margin: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <h1>CampusSphere Institute of Technology</h1>
    <p>Office of Academic Affairs & Controller of Examinations</p>
    <p><strong>OFFICIAL ACADEMIC TRANSCRIPT</strong></p>
  </div>
  <div class="student-info">
    <div><strong>Student Name:</strong> ${transcript.student.name}</div>
    <div><strong>Roll Number:</strong> ${transcript.student.rollNumber}</div>
    <div><strong>Permanent Registration No (PRN):</strong> ${transcript.student.prnNumber}</div>
    <div><strong>Program:</strong> ${transcript.student.program}</div>
    <div><strong>Department:</strong> ${transcript.student.department}</div>
    <div><strong>Batch:</strong> ${transcript.student.batch}</div>
    <div><strong>Reference Number:</strong> ${transcript.summary.referenceNumber}</div>
    <div><strong>Issue Date:</strong> ${transcript.summary.issuedDate}</div>
  </div>
  ${transcript.semesters
    .map(
      (sem) => `
    <div class="sem-block">
      <div class="sem-title">
        <span>Semester ${sem.semesterNumber} (${sem.academicYear} — ${sem.term})</span>
        <span>Semester GPA: ${sem.gpa.toFixed(2)} | Credits Earned: ${sem.creditsEarned}/${sem.creditsAttempted}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Title</th>
            <th class="text-center">Credits</th>
            <th class="text-center">Max Marks</th>
            <th class="text-center">Marks Obtained</th>
            <th class="text-center">Grade</th>
            <th class="text-center">Grade Point</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${sem.subjects
            .map(
              (sub) => `
            <tr>
              <td>${sub.subjectCode}</td>
              <td>${sub.subjectName}</td>
              <td class="text-center">${sub.credits}</td>
              <td class="text-center">${sub.maxMarks}</td>
              <td class="text-center">${sub.marksObtained}</td>
              <td class="text-center"><strong>${sub.gradeLetter}</strong></td>
              <td class="text-center">${sub.gradePoint.toFixed(1)}</td>
              <td class="text-center" style="color: ${sub.isPassed ? "#15803d" : "#b91c1c"}; font-weight: 600;">
                ${sub.isAbsent ? "ABSENT" : sub.isPassed ? "PASS" : "FAIL"}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
    )
    .join("")}
  <div class="summary-box">
    <div>Total Credits Attempted: <strong>${transcript.summary.totalCreditsAttempted}</strong></div>
    <div>Total Credits Earned: <strong>${transcript.summary.totalCreditsEarned}</strong></div>
    <div>Cumulative CGPA: <strong style="color: #15803d; font-size: 18px;">${transcript.summary.cumulativeCgpa.toFixed(2)}</strong></div>
    <div>Degree Classification: <strong>${transcript.summary.degreeClassification}</strong></div>
  </div>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export transcript" }, { status: 500 });
  }
}
