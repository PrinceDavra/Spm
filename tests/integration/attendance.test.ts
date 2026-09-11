import { describe, it, expect } from "vitest";
import { AttendanceService } from "@/services/attendance.service";
import {
  calculateAttendancePercentage,
  calculateAttendanceProjection,
  getAttendanceRisk,
  AttendanceRisk,
} from "@/lib/attendance/calculator";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Role, AttendanceStatus } from "@prisma/client";
import { DEMO_ATTENDANCE_DATABASE } from "@/lib/attendance/demo-attendance";

describe("Phase 4: Attendance Tracking, Analytics & Projection Engine Tests", () => {
  const studentDemo = DEMO_USERS.find((u) => u.role === Role.STUDENT)!;
  const facultyDemo = DEMO_USERS.find((u) => u.role === Role.FACULTY)!;
  const adminDemo = DEMO_USERS.find((u) => u.role === Role.ADMIN)!;

  // ==========================================
  // MATHEMATICAL PROJECTION & CALCULATION ENGINE
  // ==========================================
  describe("Mathematical Calculation & Projection Engine", () => {
    it("13. Attendance percentage is calculated correctly", () => {
      expect(calculateAttendancePercentage(36, 50)).toBe(72);
      expect(calculateAttendancePercentage(40, 50)).toBe(80);
      expect(calculateAttendancePercentage(33, 44)).toBe(75);
    });

    it("14. 75% projection calculation is accurate per spec example", () => {
      // Example from specification: Present = 36, Conducted = 50 -> Current 72%
      // Next consecutive classes:
      // 37/51 = 72.55%, 38/52 = 73.08%, 39/53 = 73.58%, 40/54 = 74.07%, 41/55 = 74.55%, 42/56 = 75.00%
      // Required = 6 classes
      const proj = calculateAttendanceProjection(36, 50, 75);
      expect(proj.currentPercentage).toBe(72);
      expect(proj.classesNeededToReachTarget).toBe(6);
      expect(proj.classesCanMissWhileSafe).toBe(0);
      expect(proj.risk).toBe(AttendanceRisk.WARNING);
      expect(proj.projectionMessage).toContain("Attend the next 6 consecutive classes");
    });

    it("15. Required classes calculation handles severe deficits (Critical)", () => {
      // 10 conducted, 3 attended = 30%. Target = 75%
      // Formula: ceil((75*10 - 100*3) / (100 - 75)) = ceil((750 - 300) / 25) = ceil(450/25) = 18
      // If +18 classes: (3+18)/(10+18) = 21/28 = 75%
      const proj = calculateAttendanceProjection(3, 10, 75);
      expect(proj.currentPercentage).toBe(30);
      expect(proj.classesNeededToReachTarget).toBe(18);
      expect(proj.risk).toBe(AttendanceRisk.CRITICAL);
    });

    it("16. Missable classes calculation handles safe buffer margin", () => {
      // 40 attended out of 40 conducted = 100%. Target = 75%
      // Formula: floor((100*40 - 75*40) / 75) = floor((4000 - 3000)/75) = floor(1000/75) = 13
      // If misses 13 classes: 40 / 53 = 75.47% (>= 75%). If misses 14: 40/54 = 74.07% (< 75%)
      const proj = calculateAttendanceProjection(40, 40, 75);
      expect(proj.currentPercentage).toBe(100);
      expect(proj.classesNeededToReachTarget).toBe(0);
      expect(proj.classesCanMissWhileSafe).toBe(13);
      expect(proj.risk).toBe(AttendanceRisk.SAFE);
    });

    it("17. Safe status is correct (>= 75%)", () => {
      expect(getAttendanceRisk(75, 75)).toBe(AttendanceRisk.SAFE);
      expect(getAttendanceRisk(75.1, 75)).toBe(AttendanceRisk.SAFE);
      expect(getAttendanceRisk(92, 75)).toBe(AttendanceRisk.SAFE);
    });

    it("18. Warning status is correct (65% to 74.99%)", () => {
      expect(getAttendanceRisk(74.99, 75)).toBe(AttendanceRisk.WARNING);
      expect(getAttendanceRisk(70, 75)).toBe(AttendanceRisk.WARNING);
      expect(getAttendanceRisk(65.0, 75)).toBe(AttendanceRisk.WARNING);
    });

    it("19. Critical status is correct (< 65%)", () => {
      expect(getAttendanceRisk(64.9, 75)).toBe(AttendanceRisk.CRITICAL);
      expect(getAttendanceRisk(50, 75)).toBe(AttendanceRisk.CRITICAL);
      expect(getAttendanceRisk(0, 75)).toBe(AttendanceRisk.CRITICAL);
    });

    it("20. Edge cases such as 0 conducted classes are handled safely without NaN or div by 0", () => {
      const pct = calculateAttendancePercentage(0, 0);
      expect(pct).toBe(100);

      const proj = calculateAttendanceProjection(0, 0, 75);
      expect(proj.currentPercentage).toBe(100);
      expect(proj.classesNeededToReachTarget).toBe(0);
      expect(proj.risk).toBe(AttendanceRisk.SAFE);
    });
  });

  // ==========================================
  // STUDENT PRIVACY & PERMISSIONS
  // ==========================================
  describe("Student Attendance Access & Privacy", () => {
    it("2. Student can view own attendance summary", async () => {
      const summary = await AttendanceService.getStudentSummary(studentDemo.id);
      expect(summary).toBeDefined();
      expect(summary.studentId).toBe(studentDemo.id);
      expect(summary.overallConducted).toBeGreaterThan(0);
      expect(summary.overallPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.subjectBreakdown.length).toBeGreaterThan(0);
    });

    it("2a. Student can view own attendance history and calendar", async () => {
      const history = await AttendanceService.getStudentHistory(studentDemo.id);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      // Verify all returned records belong to this student
      for (const rec of history) {
        expect(rec.studentId).toBe(studentDemo.id);
      }

      const calendar = await AttendanceService.getStudentCalendar(studentDemo.id, 2026, 9);
      expect(calendar).toBeDefined();
    });

    it("3. Student cannot view another student's attendance records in history", async () => {
      // Query history for studentDemo — must NOT contain records of other students
      const history = await AttendanceService.getStudentHistory(studentDemo.id);
      const otherStudentRecords = history.filter((r) => r.studentId !== studentDemo.id);
      expect(otherStudentRecords.length).toBe(0);
    });

    it("4. Student cannot mark attendance (rejected at authorization)", async () => {
      // Attempting to mark attendance using a student ID must fail authorization
      await expect(
        AttendanceService.markAttendance(studentDemo.id, {
          facultySubjectId: "fs-dbms-001",
          divisionId: "div-ce-6a",
          date: "2026-09-25",
          periodNumber: 1,
          topicCovered: "Unauthorized marking attempt",
          records: [
            { studentId: studentDemo.id, status: AttendanceStatus.PRESENT },
          ],
        })
      ).rejects.toThrow(/Security Violation/i);
    });

    it("5. Student cannot modify attendance records", async () => {
      const existing = DEMO_ATTENDANCE_DATABASE[0];
      await expect(
        AttendanceService.editAttendanceRecord(
          studentDemo.id,
          existing.id,
          AttendanceStatus.PRESENT,
          "Student attempting self edit"
        )
      ).rejects.toThrow(/Security Violation/i);
    });
  });

  // ==========================================
  // FACULTY REGISTER, ROSTER & RBAC
  // ==========================================
  describe("Faculty Register & Subject Authorization", () => {
    it("6. Faculty can access assigned subject attendance sheet", async () => {
      const sheet = await AttendanceService.getAttendanceSheet(
        facultyDemo.id,
        "fs-dbms-div-a",
        "div-comp-a",
        "2026-09-30",
        4
      );

      expect(sheet).toBeDefined();
      expect(sheet.subject.code).toBe("COMP-301");
      expect(sheet.roster.length).toBeGreaterThan(0);
    });

    it("7. Faculty cannot access unauthorized subject", async () => {
      // Attempting to access an unassigned subject ID
      await expect(
        AttendanceService.getAttendanceSheet(
          facultyDemo.id,
          "unassigned-subject-999",
          "div-comp-a",
          "2026-09-30",
          1
        )
      ).rejects.toThrow(/Security Violation/i);
    });

    it("8 & 9. Faculty can mark and bulk mark attendance for class", async () => {
      const testDate = "2026-09-28";
      const testPeriod = 5;

      const result = await AttendanceService.markAttendance(facultyDemo.id, {
        facultySubjectId: "fs-dbms-div-a",
        divisionId: "div-comp-a",
        date: testDate,
        periodNumber: testPeriod,
        topicCovered: "Advanced Query Optimization",
        records: [
          { studentId: studentDemo.id, status: AttendanceStatus.PRESENT },
          { studentId: "demo-student-002", status: AttendanceStatus.ABSENT },
          { studentId: "demo-student-003", status: AttendanceStatus.PRESENT },
          { studentId: "demo-student-004", status: AttendanceStatus.PRESENT },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.recordsMarked).toBe(4);

      // Verify records are persisted in database store
      const addedRecords = DEMO_ATTENDANCE_DATABASE.filter(
        (r) =>
          r.facultySubjectId === "fs-dbms-div-a" &&
          r.date === testDate &&
          r.periodNumber === testPeriod
      );
      expect(addedRecords.length).toBe(4);
    });

    it("10. Duplicate attendance for same subject/division/date/period is rejected", async () => {
      const duplicateDate = "2026-09-28";
      const duplicatePeriod = 5;

      // Attempting to submit attendance for the same period again
      await expect(
        AttendanceService.markAttendance(facultyDemo.id, {
          facultySubjectId: "fs-dbms-div-a",
          divisionId: "div-comp-a",
          date: duplicateDate,
          periodNumber: duplicatePeriod,
          topicCovered: "Duplicate Submission Attempt",
          records: [
            { studentId: studentDemo.id, status: AttendanceStatus.PRESENT },
          ],
        })
      ).rejects.toThrow(/Duplicate Attendance/i);
    });

    it("11 & 12. Faculty can edit authorized attendance and generate audit log", async () => {
      // Find a record for fs-dbms-div-a
      const record = DEMO_ATTENDANCE_DATABASE.find(
        (r) => r.facultySubjectId === "fs-dbms-div-a"
      )!;
      const originalStatus = record.status;
      const targetStatus =
        originalStatus === AttendanceStatus.PRESENT
          ? AttendanceStatus.ABSENT
          : AttendanceStatus.PRESENT;

      const auditReason = "Student submitted verified medical OD certificate.";

      const editResult = await AttendanceService.editAttendanceRecord(
        facultyDemo.id,
        record.id,
        targetStatus,
        auditReason
      );

      expect(editResult.success).toBe(true);
      expect(editResult.newStatus).toBe(targetStatus);
      expect(editResult.record.remarks).toContain(auditReason);

      // Verify persistence
      const reloaded = DEMO_ATTENDANCE_DATABASE.find((r) => r.id === record.id)!;
      expect(reloaded.status).toBe(targetStatus);
    });
  });

  // ==========================================
  // FACULTY ANALYTICS & STUDENTS AT RISK
  // ==========================================
  describe("Faculty Analytics & Risk Reporting", () => {
    it("Faculty can view analytics and at-risk students for assigned subject", async () => {
      const analytics = await AttendanceService.getFacultyAnalytics(
        facultyDemo.id,
        "fs-dbms-div-a"
      );

      expect(analytics).toBeDefined();
      expect(analytics.totalStudents).toBeGreaterThan(0);
      expect(analytics.avgPercentage).toBeGreaterThan(0);
      expect(Array.isArray(analytics.atRiskStudents)).toBe(true);

      // Check student with lowest attendance (Sneha or Rohan)
      if (analytics.atRiskStudents.length > 0) {
        const lowest = analytics.atRiskStudents[0];
        expect(lowest.percentage).toBeLessThan(75);
        expect(lowest.classesNeeded).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================
  // INTEGRATION CONSISTENCY
  // ==========================================
  describe("24 & 25. Dashboard Integration Consistency", () => {
    it("24. Student dashboard reflects actual attendance numbers", async () => {
      const summary = await AttendanceService.getStudentSummary(studentDemo.id);
      expect(typeof summary.overallPercentage).toBe("number");
      expect(summary.overallConducted).toBe(
        summary.overallPresent + summary.overallAbsent
      );
    });

    it("25. Faculty dashboard reflects assigned subjects and class average", async () => {
      const subjects = await AttendanceService.getFacultySubjects(facultyDemo.id);
      expect(subjects.length).toBeGreaterThanOrEqual(1);

      const analytics = await AttendanceService.getFacultyAnalytics(
        facultyDemo.id,
        subjects[0].facultySubjectId
      );
      expect(analytics.avgPercentage).toBeGreaterThanOrEqual(0);
    });
  });
});
