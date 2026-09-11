import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  DEMO_ATTENDANCE_DATABASE,
  DEMO_FACULTY_SUBJECTS,
  DEMO_ENROLLED_STUDENTS,
  DemoSessionRecord,
} from "@/lib/attendance/demo-attendance";
import {
  calculateAttendancePercentage,
  calculateAttendanceProjection,
  getAttendanceRisk,
  AttendanceRisk,
  AttendanceProjectionResult,
} from "@/lib/attendance/calculator";
import { MarkAttendanceInput } from "@/validators/attendance.schema";
import { AttendanceStatus } from "@prisma/client";

export interface SubjectAttendanceStat {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  conducted: number;
  present: number;
  absent: number;
  percentage: number;
  risk: AttendanceRisk;
  projectionText: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  rollNumber: string;
  overallConducted: number;
  overallPresent: number;
  overallAbsent: number;
  overallPercentage: number;
  overallRisk: AttendanceRisk;
  projection: AttendanceProjectionResult;
  subjectBreakdown: SubjectAttendanceStat[];
}

export class AttendanceService {
  /**
   * Retrieves summary attendance, subject-wise stats, and mathematical projection for a student.
   */
  static async getStudentSummary(
    studentUserId: string,
    targetPercentage = 75
  ): Promise<StudentAttendanceSummary> {
    // Collect records for student
    const studentRecords = DEMO_ATTENDANCE_DATABASE.filter(
      (r) => r.studentId === studentUserId
    );

    // Group by subject
    const subjectMap: Record<
      string,
      {
        subjectCode: string;
        subjectName: string;
        facultyName: string;
        conducted: number;
        present: number;
      }
    > = {};

    studentRecords.forEach((rec) => {
      if (!subjectMap[rec.subjectCode]) {
        subjectMap[rec.subjectCode] = {
          subjectCode: rec.subjectCode,
          subjectName: rec.subjectName,
          facultyName: rec.facultyName,
          conducted: 0,
          present: 0,
        };
      }
      subjectMap[rec.subjectCode].conducted++;
      if (
        rec.status === AttendanceStatus.PRESENT ||
        rec.status === AttendanceStatus.EXCUSED
      ) {
        subjectMap[rec.subjectCode].present++;
      }
    });

    // Subject breakdown
    const subjectBreakdown: SubjectAttendanceStat[] = Object.values(
      subjectMap
    ).map((s) => {
      const pct = calculateAttendancePercentage(s.present, s.conducted);
      const risk = getAttendanceRisk(pct, targetPercentage);
      const proj = calculateAttendanceProjection(
        s.present,
        s.conducted,
        targetPercentage
      );

      return {
        subjectId: s.subjectCode,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        facultyName: s.facultyName,
        conducted: s.conducted,
        present: s.present,
        absent: s.conducted - s.present,
        percentage: pct,
        risk,
        projectionText: proj.projectionMessage,
      };
    });

    // Overall metrics
    const totalConducted = studentRecords.length;
    const totalPresent = studentRecords.filter(
      (r) =>
        r.status === AttendanceStatus.PRESENT ||
        r.status === AttendanceStatus.EXCUSED
    ).length;
    const totalAbsent = totalConducted - totalPresent;
    const overallPercentage = calculateAttendancePercentage(
      totalPresent,
      totalConducted
    );
    const overallRisk = getAttendanceRisk(overallPercentage, targetPercentage);
    const projection = calculateAttendanceProjection(
      totalPresent,
      totalConducted,
      targetPercentage
    );

    const studentInfo =
      DEMO_ENROLLED_STUDENTS.find((s) => s.id === studentUserId) || {
        rollNumber: "22COMPA101",
      };

    return {
      studentId: studentUserId,
      rollNumber: studentInfo.rollNumber,
      overallConducted: totalConducted,
      overallPresent: totalPresent,
      overallAbsent: totalAbsent,
      overallPercentage,
      overallRisk,
      projection,
      subjectBreakdown,
    };
  }

  /**
   * Retrieves chronological filtered attendance history for a student.
   */
  static async getStudentHistory(
    studentUserId: string,
    filters?: {
      subjectCode?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<DemoSessionRecord[]> {
    let records = DEMO_ATTENDANCE_DATABASE.filter(
      (r) => r.studentId === studentUserId
    );

    if (filters?.subjectCode && filters.subjectCode !== "ALL") {
      records = records.filter((r) => r.subjectCode === filters.subjectCode);
    }

    if (filters?.status && filters.status !== "ALL") {
      records = records.filter((r) => r.status === filters.status);
    }

    if (filters?.startDate) {
      records = records.filter((r) => r.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      records = records.filter((r) => r.date <= filters.endDate!);
    }

    // Sort newest first
    return records.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Retrieves calendar sessions grouped by date for a given month.
   */
  static async getStudentCalendar(
    studentUserId: string,
    year: number,
    month: number
  ) {
    const studentRecords = DEMO_ATTENDANCE_DATABASE.filter(
      (r) => r.studentId === studentUserId
    );

    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    const monthRecords = studentRecords.filter((r) =>
      r.date.startsWith(monthPrefix)
    );

    const dateMap: Record<string, DemoSessionRecord[]> = {};

    monthRecords.forEach((rec) => {
      if (!dateMap[rec.date]) {
        dateMap[rec.date] = [];
      }
      dateMap[rec.date].push(rec);
    });

    return dateMap;
  }

  /**
   * Retrieves subjects assigned to the given faculty user.
   */
  static async getFacultySubjects(facultyUserId: string) {
    return DEMO_FACULTY_SUBJECTS.filter((s) => s.facultyId === facultyUserId);
  }

  /**
   * Retrieves the attendance register sheet for faculty to mark a class.
   * Performs authorization: verifies that facultySubject belongs to the logged-in faculty.
   */
  static async getAttendanceSheet(
    facultyUserId: string,
    facultySubjectId: string,
    divisionId: string,
    date: string,
    periodNumber: number
  ) {
    // 1. Authorization check: Faculty must be assigned to this subject
    const mapping = DEMO_FACULTY_SUBJECTS.find(
      (s) =>
        s.facultySubjectId === facultySubjectId &&
        (s.facultyId === facultyUserId || facultyUserId === "demo-admin-001")
    );

    if (!mapping) {
      throw new Error(
        "Security Violation: You are not authorized to mark attendance for this subject or division."
      );
    }

    // 2. Check if attendance was already recorded for this session
    const existingRecords = DEMO_ATTENDANCE_DATABASE.filter(
      (r) =>
        r.facultySubjectId === facultySubjectId &&
        r.divisionId === divisionId &&
        r.date === date &&
        r.periodNumber === periodNumber
    );

    const isAlreadyRecorded = existingRecords.length > 0;

    // 3. Prepare student roster with current attendance percentages
    const roster = DEMO_ENROLLED_STUDENTS.map((student) => {
      const allStudentRecords = DEMO_ATTENDANCE_DATABASE.filter(
        (r) =>
          r.studentId === student.id &&
          r.facultySubjectId === facultySubjectId
      );
      const total = allStudentRecords.length;
      const present = allStudentRecords.filter(
        (r) =>
          r.status === AttendanceStatus.PRESENT ||
          r.status === AttendanceStatus.EXCUSED
      ).length;
      const currentPct = calculateAttendancePercentage(present, total);

      // Existing status in this specific session (if already recorded)
      const thisSessionRecord = existingRecords.find(
        (r) => r.studentId === student.id
      );

      return {
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        prn: student.prn,
        currentPercentage: currentPct,
        status: thisSessionRecord ? thisSessionRecord.status : AttendanceStatus.PRESENT,
        recordId: thisSessionRecord?.id,
      };
    });

    return {
      subject: mapping,
      date,
      periodNumber,
      isAlreadyRecorded,
      existingTopic: existingRecords[0]?.topicCovered || "",
      roster,
    };
  }

  /**
   * Marks attendance for an entire class division session.
   * Validates duplicate submission, authorization, and student IDs.
   */
  static async markAttendance(
    facultyUserId: string,
    input: MarkAttendanceInput
  ) {
    // 1. Authorization Check
    const mapping = DEMO_FACULTY_SUBJECTS.find(
      (s) =>
        s.facultySubjectId === input.facultySubjectId &&
        (s.facultyId === facultyUserId || facultyUserId === "demo-admin-001")
    );

    if (!mapping) {
      throw new Error(
        "Security Violation: You do not have permission to mark attendance for this subject."
      );
    }

    // 2. Duplicate Check
    const duplicate = DEMO_ATTENDANCE_DATABASE.some(
      (r) =>
        r.facultySubjectId === input.facultySubjectId &&
        r.divisionId === input.divisionId &&
        r.date === input.date &&
        r.periodNumber === input.periodNumber
    );

    if (duplicate) {
      throw new Error(
        `Duplicate Attendance: Attendance for ${mapping.name} on ${input.date}, Period ${input.periodNumber} has already been recorded.`
      );
    }

    // 3. Create Session Attendance ID
    const attendanceId = `att-sess-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 4. Save each student record
    input.records.forEach((rec, idx) => {
      const student = DEMO_ENROLLED_STUDENTS.find(
        (s) => s.id === rec.studentId
      );
      if (!student) {
        throw new Error(`Invalid Student ID: ${rec.studentId}`);
      }

      DEMO_ATTENDANCE_DATABASE.push({
        id: `rec-new-${Date.now()}-${idx}`,
        attendanceId,
        facultySubjectId: input.facultySubjectId,
        subjectCode: mapping.code,
        subjectName: mapping.name,
        facultyName: mapping.facultyName,
        divisionId: input.divisionId,
        date: input.date,
        periodNumber: input.periodNumber,
        topicCovered: input.topicCovered || "Class Lecture",
        studentId: student.id,
        rollNumber: student.rollNumber,
        studentName: student.name,
        status: rec.status as AttendanceStatus,
        remarks: rec.remarks,
        updatedAt: timestamp,
      });
    });

    // 5. Audit Log Entry
    try {
      const isOnline = await isDatabaseOnline();
      if (isOnline) {
        await prisma.auditLog.create({
          data: {
            userId: facultyUserId,
            action: "MARK_ATTENDANCE",
            entity: "Attendance",
            entityId: attendanceId,
            details: {
              subject: mapping.name,
              date: input.date,
              period: input.periodNumber,
              totalMarked: input.records.length,
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      attendanceId,
      recordsMarked: input.records.length,
    };
  }

  /**
   * Edits an individual student's past attendance record with mandatory audit logging.
   */
  static async editAttendanceRecord(
    facultyUserId: string,
    recordId: string,
    newStatus: AttendanceStatus,
    reasonForEdit: string
  ) {
    const record = DEMO_ATTENDANCE_DATABASE.find((r) => r.id === recordId);

    if (!record) {
      throw new Error(`Attendance record ${recordId} not found.`);
    }

    // Security check
    const mapping = DEMO_FACULTY_SUBJECTS.find(
      (s) =>
        s.facultySubjectId === record.facultySubjectId &&
        (s.facultyId === facultyUserId || facultyUserId === "demo-admin-001")
    );

    if (!mapping) {
      throw new Error(
        "Security Violation: You are not authorized to edit attendance records for this subject."
      );
    }

    const oldStatus = record.status;
    record.status = newStatus;
    record.updatedAt = new Date().toISOString();
    record.remarks = `Edited by ${mapping.facultyName}. Reason: ${reasonForEdit}`;

    // Record Audit Log
    try {
      const isOnline = await isDatabaseOnline();
      if (isOnline) {
        await prisma.auditLog.create({
          data: {
            userId: facultyUserId,
            action: "EDIT_ATTENDANCE",
            entity: "AttendanceRecord",
            entityId: recordId,
            details: {
              studentId: record.studentId,
              studentRoll: record.rollNumber,
              subject: record.subjectName,
              date: record.date,
              period: record.periodNumber,
              oldStatus,
              newStatus,
              reason: reasonForEdit,
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      record,
      oldStatus,
      newStatus,
    };
  }

  /**
   * Computes class analytics & "Students At Risk" for an assigned faculty subject.
   */
  static async getFacultyAnalytics(
    facultyUserId: string,
    facultySubjectId: string
  ) {
    const mapping = DEMO_FACULTY_SUBJECTS.find(
      (s) =>
        s.facultySubjectId === facultySubjectId &&
        (s.facultyId === facultyUserId || facultyUserId === "demo-admin-001")
    );

    if (!mapping) {
      throw new Error("Subject mapping not found or access denied.");
    }

    const subjectRecords = DEMO_ATTENDANCE_DATABASE.filter(
      (r) => r.facultySubjectId === facultySubjectId
    );

    // Compute student-level stats
    const studentStats = DEMO_ENROLLED_STUDENTS.map((student) => {
      const records = subjectRecords.filter((r) => r.studentId === student.id);
      const total = records.length;
      const present = records.filter(
        (r) =>
          r.status === AttendanceStatus.PRESENT ||
          r.status === AttendanceStatus.EXCUSED
      ).length;
      const pct = calculateAttendancePercentage(present, total);
      const risk = getAttendanceRisk(pct, 75);
      const proj = calculateAttendanceProjection(present, total, 75);

      return {
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        prn: student.prn,
        totalClasses: total,
        presentClasses: present,
        percentage: pct,
        risk,
        classesNeeded: proj.classesNeededToReachTarget,
        canMiss: proj.classesCanMissWhileSafe,
      };
    });

    const totalStudents = studentStats.length;
    const avgPercentage =
      totalStudents > 0
        ? Math.round(
            (studentStats.reduce((sum, s) => sum + s.percentage, 0) /
              totalStudents) *
              10
          ) / 10
        : 100;

    const studentsBelow75 = studentStats.filter((s) => s.percentage < 75);
    const studentsBelow65 = studentStats.filter((s) => s.percentage < 65);

    // Sort at-risk students by lowest percentage first
    const atRiskStudents = [...studentsBelow75].sort(
      (a, b) => a.percentage - b.percentage
    );

    return {
      subject: mapping,
      totalStudents,
      avgPercentage,
      below75Count: studentsBelow75.length,
      below65Count: studentsBelow65.length,
      studentStats,
      atRiskStudents,
    };
  }
}
