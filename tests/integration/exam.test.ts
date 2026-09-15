import { describe, it, expect, beforeEach } from "vitest";
import { ExamService } from "@/services/exam.service";
import { ExamType, ExamStatus, RevaluationStatus, Role } from "@prisma/client";
import {
  DEMO_EXAMS_STORE,
  DEMO_EXAM_ENROLLMENTS_STORE,
  DEMO_GRADEBOOK_STORE,
  DEMO_EXAM_RESULTS_STORE,
  DEMO_REVALUATION_STORE,
  calculateGrade,
  getDegreeClassification,
} from "@/lib/exam/demo-exams";

describe("Phase 15 — Exam Management, Gradebook, Results & Transcripts", () => {
  beforeEach(() => {
    // Stores maintain persistent state; initial records are preserved
  });

  // =========================================================================
  // 1. LIFECYCLE & INPUT VALIDATION
  // =========================================================================
  describe("1. Exam Lifecycle & Validation", () => {
    it("creates a draft exam with valid parameters", async () => {
      const exam = await ExamService.createExam(
        {
          title: "Unit Test Assessment — Distributed Algorithms",
          examType: ExamType.INTERNAL,
          academicYear: "2024-2025",
          semesterNumber: 6,
          departmentId: "dept-comp",
          subjectId: "subj-dbms",
          date: "2026-06-15",
          startTime: "10:00",
          endTime: "11:30",
          maxMarks: 50,
          passingMarks: 20,
        },
        "demo-admin-001"
      );

      expect(exam.id).toBeDefined();
      expect(exam.status).toBe(ExamStatus.DRAFT);
      expect(exam.title).toContain("Distributed Algorithms");
      expect(exam.maxMarks).toBe(50);
      expect(exam.passingMarks).toBe(20);
    });

    it("rejects exam creation when passing marks exceed maximum marks", async () => {
      const invalidData = {
        title: "Invalid Marks Exam",
        examType: ExamType.MIDTERM,
        academicYear: "2024-2025",
        semesterNumber: 6,
        departmentId: "dept-comp",
        subjectId: "subj-dbms",
        date: "2026-06-15",
        startTime: "10:00",
        endTime: "11:30",
        maxMarks: 40,
        passingMarks: 50, // Invalid!
      };

      const { createExamSchema } = await import("@/validators/exam.schema");
      const result = createExamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Passing marks cannot exceed maximum marks");
      }
    });

    it("rejects exam creation when end time is before start time", async () => {
      const invalidTimeData = {
        title: "Invalid Time Exam",
        examType: ExamType.MIDTERM,
        academicYear: "2024-2025",
        semesterNumber: 6,
        departmentId: "dept-comp",
        subjectId: "subj-dbms",
        date: "2026-06-15",
        startTime: "14:00",
        endTime: "13:00", // Invalid!
        maxMarks: 50,
        passingMarks: 20,
      };

      const { createExamSchema } = await import("@/validators/exam.schema");
      const result = createExamSchema.safeParse(invalidTimeData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("End time must be strictly after start time");
      }
    });

    it("updates exam attributes successfully", async () => {
      const exam = await ExamService.createExam(
        {
          title: "Temporary Update Exam",
          examType: ExamType.INTERNAL,
          academicYear: "2024-2025",
          semesterNumber: 6,
          departmentId: "dept-comp",
          subjectId: "subj-dbms",
          date: "2026-06-20",
          startTime: "10:00",
          endTime: "11:30",
          maxMarks: 50,
          passingMarks: 20,
        },
        "demo-admin-001"
      );

      const updated = await ExamService.updateExam(
        exam.id,
        { title: "Renamed Assessment Title", maxMarks: 60 },
        "demo-admin-001"
      );

      expect(updated.title).toBe("Renamed Assessment Title");
      expect(updated.maxMarks).toBe(60);
    });

    it("blocks updates on locked exams", async () => {
      await expect(
        ExamService.updateExam("exam-007", { title: "Attempt to change locked exam" }, "demo-admin-001")
      ).rejects.toThrow(/Cannot update an exam with status 'LOCKED'/);
    });
  });

  // =========================================================================
  // 2. SCHEDULING & CONFLICT DETECTION
  // =========================================================================
  describe("2. Scheduling & Conflict Detection", () => {
    it("successfully schedules an exam without conflicts", async () => {
      const exam = await ExamService.createExam(
        {
          title: "Schedule Free Exam",
          examType: ExamType.MIDTERM,
          academicYear: "2024-2025",
          semesterNumber: 6,
          departmentId: "dept-comp",
          subjectId: "subj-dbms",
          date: "2026-07-10",
          startTime: "10:00",
          endTime: "11:30",
          maxMarks: 50,
          passingMarks: 20,
        },
        "demo-admin-001"
      );

      const scheduled = await ExamService.scheduleExam(
        exam.id,
        {
          date: "2026-07-10",
          startTime: "10:00",
          endTime: "11:30",
          roomId: "room-301",
          facultyId: "demo-faculty-001",
        },
        "demo-admin-001"
      );

      expect(scheduled.status).toBe(ExamStatus.SCHEDULED);
      expect(scheduled.roomId).toBe("room-301");
      expect(scheduled.facultyId).toBe("demo-faculty-001");
    });

    it("detects room collision when another exam is already scheduled at the same time", () => {
      // exam-005 is scheduled on 2026-04-24 from 10:00 to 13:00 in room-302
      const conflict = ExamService.checkSchedulingConflicts({
        date: "2026-04-24",
        startTime: "11:00",
        endTime: "12:30",
        roomId: "room-302",
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.errors.some((err) => err.includes("Room collision"))).toBe(true);
    });

    it("detects faculty clash when invigilator is assigned elsewhere at the same time", () => {
      // exam-005 has facultyId demo-faculty-001 on 2026-04-24 from 10:00 to 13:00
      const conflict = ExamService.checkSchedulingConflicts({
        date: "2026-04-24",
        startTime: "10:30",
        endTime: "12:00",
        facultyId: "demo-faculty-001",
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.errors.some((err) => err.includes("Faculty conflict"))).toBe(true);
    });

    it("enforces laboratory facility requirement for practical exams", () => {
      // room-301 is a CLASSROOM, not a LAB
      const conflict = ExamService.checkSchedulingConflicts({
        date: "2026-07-15",
        startTime: "10:00",
        endTime: "12:00",
        roomId: "room-301",
        examType: ExamType.PRACTICAL,
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.errors.some((err) => err.includes("Practical exams require a laboratory facility"))).toBe(true);
    });

    it("rejects exams shorter than minimum 30 minutes duration", () => {
      const conflict = ExamService.checkSchedulingConflicts({
        date: "2026-07-20",
        startTime: "10:00",
        endTime: "10:15",
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.errors.some((err) => err.includes("at least 30 minutes"))).toBe(true);
    });
  });

  // =========================================================================
  // 3. GRADEBOOK & MARK ENTRIES
  // =========================================================================
  describe("3. Gradebook & Evaluation Matrix", () => {
    it("retrieves gradebook entries with progress statistics for authorized faculty", async () => {
      const gradebook = await ExamService.getExamGradebook("exam-001", "demo-faculty-001", Role.FACULTY);

      expect(gradebook.exam).toBeDefined();
      expect(Array.isArray(gradebook.entries)).toBe(true);
      expect(gradebook.stats.totalEnrolled).toBeGreaterThan(0);
      expect(typeof gradebook.stats.gradedCount).toBe("number");
    });

    it("blocks students from accessing the full class gradebook", async () => {
      await expect(
        ExamService.getExamGradebook("exam-001", "demo-student-001", Role.STUDENT)
      ).rejects.toThrow(/Students are not authorized/);
    });

    it("saves student marks and deterministically computes grade and grade point", async () => {
      const saveRes = await ExamService.saveGradebookEntries(
        "exam-001",
        [
          {
            studentId: "demo-student-001",
            marksObtained: 45, // 45 / 50 = 90% -> A+ (10.0)
            isAbsent: false,
            remarks: "Exemplary solution",
          },
        ],
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(saveRes.success).toBe(true);
      const savedEntry = saveRes.entries[0];
      expect(savedEntry.marksObtained).toBe(45);
      expect(savedEntry.gradeLetter).toBe("A+");
      expect(savedEntry.gradePoint).toBe(10.0);
      expect(savedEntry.isPassed).toBe(true);
    });

    it("rejects negative marks with error", async () => {
      await expect(
        ExamService.saveGradebookEntries(
          "exam-001",
          [{ studentId: "demo-student-001", marksObtained: -5, isAbsent: false }],
          "demo-faculty-001",
          Role.FACULTY
        )
      ).rejects.toThrow(/Marks cannot be negative/);
    });

    it("rejects marks exceeding maximum marks", async () => {
      // exam-001 maxMarks is 50
      await expect(
        ExamService.saveGradebookEntries(
          "exam-001",
          [{ studentId: "demo-student-001", marksObtained: 55, isAbsent: false }],
          "demo-faculty-001",
          Role.FACULTY
        )
      ).rejects.toThrow(/cannot exceed maximum marks/);
    });

    it("correctly handles absent candidates setting marks to 0 and grade to F", async () => {
      const saveRes = await ExamService.saveGradebookEntries(
        "exam-001",
        [
          {
            studentId: "demo-student-003",
            marksObtained: null,
            isAbsent: true,
            remarks: "Absent without notice",
          },
        ],
        "demo-faculty-001",
        Role.FACULTY
      );

      const entry = saveRes.entries[0];
      expect(entry.isAbsent).toBe(true);
      expect(entry.marksObtained).toBe(0);
      expect(entry.gradeLetter).toBe("F");
      expect(entry.gradePoint).toBe(0.0);
      expect(entry.isPassed).toBe(false);
    });

    it("blocks grade modification on locked exams", async () => {
      await expect(
        ExamService.saveGradebookEntries(
          "exam-007", // LOCKED
          [{ studentId: "demo-student-001", marksObtained: 40, isAbsent: false }],
          "demo-faculty-001",
          Role.FACULTY
        )
      ).rejects.toThrow(/Exam is in 'LOCKED' state/);
    });
  });

  // =========================================================================
  // 4. GRADING SCALE & DETERMINISTIC CALCULATIONS
  // =========================================================================
  describe("4. Grading Scale & Deterministic Formula", () => {
    it("maps percentages to standard 10-point grades deterministically", () => {
      expect(calculateGrade(95, 100)).toEqual({ percentage: 95.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true });
      expect(calculateGrade(82, 100)).toEqual({ percentage: 82.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true });
      expect(calculateGrade(74, 100)).toEqual({ percentage: 74.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true });
      expect(calculateGrade(65, 100)).toEqual({ percentage: 65.0, gradeLetter: "B", gradePoint: 7.0, isPassed: true });
      expect(calculateGrade(52, 100)).toEqual({ percentage: 52.0, gradeLetter: "C", gradePoint: 6.0, isPassed: true });
      expect(calculateGrade(42, 100)).toEqual({ percentage: 42.0, gradeLetter: "D", gradePoint: 5.0, isPassed: true });
      expect(calculateGrade(35, 100)).toEqual({ percentage: 35.0, gradeLetter: "F", gradePoint: 0.0, isPassed: false });
    });

    it("correctly maps absent candidates to F and 0 grade points", () => {
      expect(calculateGrade(50, 100, true)).toEqual({
        percentage: 0,
        gradeLetter: "F",
        gradePoint: 0,
        isPassed: false,
      });
    });

    it("maps cumulative CGPA to standard degree classifications", () => {
      expect(getDegreeClassification(8.91)).toBe("First Class with Distinction");
      expect(getDegreeClassification(7.50)).toBe("First Class with Distinction");
      expect(getDegreeClassification(7.10)).toBe("First Class");
      expect(getDegreeClassification(6.00)).toBe("Higher Second Class");
      expect(getDegreeClassification(5.20)).toBe("Second Class");
      expect(getDegreeClassification(4.50)).toBe("Pass Class");
      expect(getDegreeClassification(3.80)).toBe("Fail");
    });
  });

  // =========================================================================
  // 5. RESULTS PUBLICATION, PRIVACY & GPA/CGPA
  // =========================================================================
  describe("5. Results Publication, Privacy & GPA Engine", () => {
    it("publishes results and updates student semester results", async () => {
      const published = await ExamService.publishResults("exam-001", "demo-admin-001");
      expect(published.status).toBe(ExamStatus.PUBLISHED);

      const results = await ExamService.getStudentResults("demo-student-001", 6);
      expect(results.publishedResults.length).toBeGreaterThan(0);
      expect(results.publishedResults[0].gpa).toBeGreaterThan(0);
      expect(results.cumulativeCgpa).toBeGreaterThan(0);
    });

    it("locks results against accidental modification", async () => {
      const locked = await ExamService.lockResults("exam-001", "demo-admin-001");
      expect(locked.status).toBe(ExamStatus.LOCKED);
    });

    it("calculates multi-semester cumulative CGPA correctly", async () => {
      const studentResults = await ExamService.getStudentResults("demo-student-001");
      expect(studentResults.cumulativeCgpa).toBeCloseTo(9.02, 1);
      expect(studentResults.degreeClassification).toBe("First Class with Distinction");
    });
  });

  // =========================================================================
  // 6. REVALUATION & GRADE CORRECTION
  // =========================================================================
  describe("6. Revaluation & Grade Correction Workflow", () => {
    it("allows student to submit revaluation request for published exam", async () => {
      const req = await ExamService.submitRevaluationRequest("demo-student-001", {
        examId: "exam-002",
        subjectId: "sub-cs602",
        reason: "Discrepancy in totaling of marks in Question 2 and Question 3.",
        requestedMarks: 49,
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe(RevaluationStatus.PENDING);
      expect(req.currentMarks).toBe(47);
    });

    it("rejects duplicate pending revaluation request from the same student", async () => {
      await expect(
        ExamService.submitRevaluationRequest("demo-student-001", {
          examId: "exam-002",
          subjectId: "sub-cs602",
          reason: "Second duplicate attempt",
        })
      ).rejects.toThrow(/already exists/);
    });

    it("blocks student self-approval of revaluation requests", async () => {
      const pendingReq = DEMO_REVALUATION_STORE.find((r) => r.status === RevaluationStatus.PENDING);
      if (pendingReq) {
        await expect(
          ExamService.reviewRevaluationRequest(
            pendingReq.id,
            { status: RevaluationStatus.APPROVED, reviewedMarks: 48, reviewerRemarks: "Self approval" },
            pendingReq.studentId, // Reviewer is student!
            Role.STUDENT
          )
        ).rejects.toThrow(/cannot review your own/);
      }
    });

    it("allows admin/faculty to review and approve revaluation updating marks", async () => {
      const pendingReq = DEMO_REVALUATION_STORE.find((r) => r.status === RevaluationStatus.PENDING);
      if (pendingReq) {
        const reviewed = await ExamService.reviewRevaluationRequest(
          pendingReq.id,
          {
            status: RevaluationStatus.APPROVED,
            reviewedMarks: 48,
            reviewerRemarks: "Verified mark sum error on question 2. 1 mark added.",
          },
          "demo-admin-001",
          Role.ADMIN
        );

        expect(reviewed.status).toBe(RevaluationStatus.APPROVED);
        expect(reviewed.reviewedMarks).toBe(48);
      }
    });
  });

  // =========================================================================
  // 7. ACADEMIC TRANSCRIPT & EXPORT
  // =========================================================================
  describe("7. Academic Transcript & Export", () => {
    it("compiles official academic transcript with full semester progression", async () => {
      const transcript = await ExamService.getAcademicTranscript("demo-student-001");

      expect(transcript.student.name).toBe("Aarav Mehta");
      expect(transcript.student.rollNumber).toBe("22COMPA101");
      expect(transcript.semesters.length).toBeGreaterThanOrEqual(5);
      expect(transcript.summary.totalCreditsEarned).toBeGreaterThan(100);
      expect(transcript.summary.cumulativeCgpa).toBeGreaterThan(8.0);
      expect(transcript.summary.referenceNumber).toContain("CS-TRANS-2025");
    });

    it("orders transcript semesters chronologically from 1 to current", async () => {
      const transcript = await ExamService.getAcademicTranscript("demo-student-001");
      for (let i = 0; i < transcript.semesters.length - 1; i++) {
        expect(transcript.semesters[i].semesterNumber).toBeLessThanOrEqual(
          transcript.semesters[i + 1].semesterNumber
        );
      }
    });
  });

  // =========================================================================
  // 8. EXAM ANALYTICS
  // =========================================================================
  describe("8. Exam Analytics Integration", () => {
    it("computes aggregate statistics for pass rate, fail rate, and grade brackets", async () => {
      const analytics = await ExamService.getExamAnalytics();

      expect(analytics.totalExams).toBeGreaterThan(0);
      expect(typeof analytics.passRate).toBe("number");
      expect(typeof analytics.failRate).toBe("number");
      expect(typeof analytics.absentRate).toBe("number");
      expect(analytics.gradeDistribution.gradeAPlus).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.subjectPerformance)).toBe(true);
    });
  });
});
