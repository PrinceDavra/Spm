import { describe, it, expect, beforeEach } from "vitest";
import { AssignmentService } from "@/services/assignment.service";
import { NotificationService, DEMO_NOTIFICATIONS_STORE } from "@/services/notification.service";
import {
  DEMO_ASSIGNMENTS_DB,
  DEMO_SUBMISSIONS_DB,
  INITIAL_DEMO_ASSIGNMENTS,
  INITIAL_DEMO_SUBMISSIONS,
} from "@/lib/assignment/demo-assignments";
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from "@/validators/assignment.schema";
import { Role, AssignmentStatus, SubmissionStatus } from "@prisma/client";

describe("Phase 6 — Assignment Management & Submission System", () => {
  beforeEach(() => {
    // Reset runtime in-memory database to initial state
    DEMO_ASSIGNMENTS_DB.length = 0;
    DEMO_ASSIGNMENTS_DB.push(...INITIAL_DEMO_ASSIGNMENTS.map((a) => ({ ...a })));

    DEMO_SUBMISSIONS_DB.length = 0;
    DEMO_SUBMISSIONS_DB.push(...INITIAL_DEMO_SUBMISSIONS.map((s) => ({ ...s })));

    DEMO_NOTIFICATIONS_STORE.length = 0;
  });

  // ==========================================
  // 1. UNIT & VALIDATION TESTS
  // ==========================================
  describe("Validation & Schema Integrity", () => {
    it("validates valid assignment creation input", () => {
      const valid = {
        title: "Distributed Transactions & 2PC Protocol",
        subjectId: "subj-dbms",
        divisionId: "div-comp-a",
        description: "Analyze two-phase commit protocol under coordinator failure.",
        maxMarks: 100,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        allowLateSubmission: true,
        latePenalty: 10,
        allowedFileTypes: ["pdf", "docx"],
      };

      const parsed = createAssignmentSchema.parse(valid);
      expect(parsed.title).toBe(valid.title);
      expect(parsed.maxMarks).toBe(100);
      expect(parsed.latePenalty).toBe(10);
    });

    it("rejects assignment with title shorter than 3 characters", () => {
      expect(() =>
        createAssignmentSchema.parse({
          title: "AB",
          subjectId: "subj-dbms",
          divisionId: "div-comp-a",
          description: "Valid description",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        })
      ).toThrow();
    });

    it("rejects assignment with non-positive marks", () => {
      expect(() =>
        createAssignmentSchema.parse({
          title: "Valid Title Here",
          subjectId: "subj-dbms",
          divisionId: "div-comp-a",
          description: "Valid description",
          maxMarks: 0,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        })
      ).toThrow();
    });

    it("rejects submission without fileUrl and without submissionText", () => {
      expect(() =>
        submitAssignmentSchema.parse({
          fileUrl: "",
          submissionText: "",
        })
      ).toThrow(/Please attach a file or provide submission solution text/);
    });

    it("validates submission with either file or text solution", () => {
      const withText = submitAssignmentSchema.parse({
        submissionText: "My solution summary here",
      });
      expect(withText.submissionText).toBe("My solution summary here");

      const withFile = submitAssignmentSchema.parse({
        fileUrl: "/uploads/file.pdf",
        fileName: "solution.pdf",
      });
      expect(withFile.fileName).toBe("solution.pdf");
    });

    it("rejects grade evaluation with negative marks", () => {
      expect(() =>
        gradeSubmissionSchema.parse({
          marks: -5,
          feedback: "Incomplete assignment",
        })
      ).toThrow();
    });

    it("rejects grade evaluation with feedback shorter than 3 characters", () => {
      expect(() =>
        gradeSubmissionSchema.parse({
          marks: 80,
          feedback: "Ok",
        })
      ).toThrow();
    });
  });

  // ==========================================
  // 2. SECURITY & FILE VALIDATION TESTS
  // ==========================================
  describe("File Safety & Security Boundaries", () => {
    it("blocks dangerous executable file extensions (.exe, .bat, .sh)", () => {
      expect(() =>
        AssignmentService.validateUploadedFile("payload.exe", ["pdf", "exe"], 10485760)
      ).toThrow(/Security Violation: Executable and script file extensions/);

      expect(() =>
        AssignmentService.validateUploadedFile("script.sh", ["sh"], 10485760)
      ).toThrow(/Security Violation: Executable and script file extensions/);

      expect(() =>
        AssignmentService.validateUploadedFile("command.bat", ["bat"], 10485760)
      ).toThrow(/Security Violation: Executable and script file extensions/);
    });

    it("blocks path traversal attempts in uploaded filenames", () => {
      expect(() =>
        AssignmentService.validateUploadedFile("../../etc/passwd.pdf", ["pdf"], 10485760)
      ).toThrow(/Security Violation: Illegal file name containing path traversal characters/);

      expect(() =>
        AssignmentService.validateUploadedFile("..\\Windows\\System32\\file.pdf", ["pdf"], 10485760)
      ).toThrow(/Security Violation: Illegal file name containing path traversal characters/);
    });

    it("rejects file extension not in allowed whitelist", () => {
      expect(() =>
        AssignmentService.validateUploadedFile("data.mp4", ["pdf", "docx"], 10485760)
      ).toThrow(/Invalid file type/);
    });

    it("rejects file size exceeding assignment max limit", () => {
      const maxAllowed = 5 * 1024 * 1024; // 5MB
      const actualSize = 6 * 1024 * 1024; // 6MB
      expect(() =>
        AssignmentService.validateUploadedFile("document.pdf", ["pdf"], maxAllowed, actualSize)
      ).toThrow(/File size exceeds maximum permitted limit/);
    });
  });

  // ==========================================
  // 3. FACULTY ASSIGNMENT LIFECYCLE TESTS
  // ==========================================
  describe("Faculty Assignment Authoring & Lifecycle", () => {
    it("allows mapped faculty to create an assignment", async () => {
      const newAsgn = await AssignmentService.createAssignment(
        "demo-faculty-001",
        Role.FACULTY,
        {
          title: "Advanced B-Tree Index Optimization",
          subjectId: "subj-dbms",
          divisionId: "div-comp-a",
          description: "Analyze index page splitting and balance under bulk insert.",
          instructions: "Submit EXPLAIN plan comparison.",
          maxMarks: 50,
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmission: true,
          latePenalty: 10,
          maxFileSize: 10485760,
          allowedFileTypes: ["pdf", "sql"],
        }
      );

      expect(newAsgn.id).toBeDefined();
      expect(newAsgn.facultyId).toBe("demo-faculty-001");
      expect(newAsgn.subjectCode).toBe("COMP-301");
      expect(DEMO_ASSIGNMENTS_DB.some((a) => a.id === newAsgn.id)).toBe(true);
    });

    it("prevents faculty from creating assignment for unmapped/unrelated subject", async () => {
      // Prof. Meera Sen (demo-faculty-001) teaches DBMS and CN, NOT Operating Systems (subj-os)
      await expect(
        AssignmentService.createAssignment("demo-faculty-001", Role.FACULTY, {
          title: "Unauthorized OS Assignment",
          subjectId: "subj-os",
          divisionId: "div-comp-a",
          description: "Trying to author OS assignment",
          maxMarks: 50,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmission: true,
          latePenalty: 10,
          maxFileSize: 10485760,
          allowedFileTypes: ["pdf"],
        })
      ).rejects.toThrow(/Security Violation: Faculty is not authorized/);
    });

    it("rejects creation with due date in the past", async () => {
      await expect(
        AssignmentService.createAssignment("demo-faculty-001", Role.FACULTY, {
          title: "Past Deadline Test",
          subjectId: "subj-dbms",
          divisionId: "div-comp-a",
          description: "Testing past date rejection",
          maxMarks: 50,
          dueDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmission: true,
          latePenalty: 10,
          maxFileSize: 10485760,
          allowedFileTypes: ["pdf"],
        })
      ).rejects.toThrow(/Assignment due date must be set in the future/);
    });

    it("publishes draft assignment and dispatches notifications to students", async () => {
      const draft = DEMO_ASSIGNMENTS_DB.find((a) => a.id === "asgn-dbms-draft")!;
      expect(draft.status).toBe(AssignmentStatus.DRAFT);

      const published = await AssignmentService.publishAssignment(
        "demo-faculty-001",
        Role.FACULTY,
        "asgn-dbms-draft"
      );

      expect(published.status).toBe(AssignmentStatus.PUBLISHED);

      // Verify notification sent
      const notifs = DEMO_NOTIFICATIONS_STORE.filter((n) =>
        n.title.includes("Assignment Published")
      );
      expect(notifs.length).toBeGreaterThan(0);
    });

    it("closes assignment and prevents further modifications", async () => {
      const closed = await AssignmentService.closeAssignment(
        "demo-faculty-001",
        Role.FACULTY,
        "asgn-dbms-01"
      );

      expect(closed.status).toBe(AssignmentStatus.CLOSED);

      // Attempting to update a closed assignment should fail
      await expect(
        AssignmentService.updateAssignment("demo-faculty-001", Role.FACULTY, "asgn-dbms-01", {
          title: "Attempted Title Edit",
        })
      ).rejects.toThrow(/Cannot modify an assignment that is already closed/);
    });
  });

  // ==========================================
  // 4. STUDENT SUBMISSION & DEADLINE TESTS
  // ==========================================
  describe("Student Submissions, Deadlines & Resubmissions", () => {
    it("hides DRAFT assignments from students", async () => {
      const result = await AssignmentService.getStudentAssignments("demo-student-001");
      const hasDraft = result.assignments.some((a) => a.status === AssignmentStatus.DRAFT);
      expect(hasDraft).toBe(false);
    });

    it("blocks students from accessing draft assignment detail directly", async () => {
      await expect(
        AssignmentService.getAssignmentDetails("demo-student-001", Role.STUDENT, "asgn-dbms-draft")
      ).rejects.toThrow(/Security Violation: Draft assignments are not accessible/);
    });

    it("allows student to submit work on-time before deadline", async () => {
      // asgn-dbms-01 is due in 18 hours
      const submission = await AssignmentService.submitAssignment("demo-student-001", "asgn-dbms-01", {
        fileName: "22COMPA101_DBMS_Schema.pdf",
        fileUrl: "/uploads/22COMPA101_DBMS_Schema.pdf",
        fileSize: 240000,
        fileType: "application/pdf",
        submissionText: "Normalized relation to BCNF with full functional dependency proof.",
      });

      expect(submission.id).toBeDefined();
      expect(submission.isLate).toBe(false);
      expect(submission.latePenaltyApplied).toBe(0);
      expect(submission.status).toBe(SubmissionStatus.SUBMITTED);
      expect(submission.version).toBe(1);
    });

    it("applies late penalty when submitting past deadline with late submission enabled", async () => {
      // asgn-se-01 passed deadline 1 day ago, allowLateSubmission: true, latePenalty: 10
      const submission = await AssignmentService.submitAssignment("demo-student-002", "asgn-se-01", {
        fileName: "22COMPA102_SRS_Late.pdf",
        fileUrl: "/uploads/22COMPA102_SRS_Late.pdf",
        fileSize: 310000,
        submissionText: "Submitting late assignment with permission.",
      });

      expect(submission.isLate).toBe(true);
      expect(submission.latePenaltyApplied).toBe(10);
      expect(submission.status).toBe(SubmissionStatus.LATE);
    });

    it("rejects late submission when allowLateSubmission is false", async () => {
      // asgn-os-01 has allowLateSubmission: false and past deadline
      await expect(
        AssignmentService.submitAssignment("demo-student-005", "asgn-os-01", {
          fileName: "late_attempt.zip",
          submissionText: "Late attempt on strict assignment",
        })
      ).rejects.toThrow(/Deadline has passed. Late submissions are not permitted/);
    });

    it("handles versioned resubmission before evaluation", async () => {
      // asgn-cn-01 already has a submission from demo-student-001 with version 1
      const resubmission = await AssignmentService.submitAssignment("demo-student-001", "asgn-cn-01", {
        fileName: "22COMPA101_Wireshark_v2.pdf",
        fileUrl: "/uploads/22COMPA101_Wireshark_v2.pdf",
        submissionText: "Revised packet trace analysis with additional congestion window graph.",
      });

      expect(resubmission.version).toBe(2);
      expect(resubmission.fileName).toBe("22COMPA101_Wireshark_v2.pdf");
      expect(resubmission.submissionText).toContain("Revised packet trace");
    });

    it("prevents resubmission if work has already been graded", async () => {
      // asgn-os-01 for demo-student-001 is already GRADED
      await expect(
        AssignmentService.submitAssignment("demo-student-001", "asgn-os-01", {
          submissionText: "Attempting to overwrite graded work",
        })
      ).rejects.toThrow(/This submission has already been graded and cannot be resubmitted/);
    });
  });

  // ==========================================
  // 5. EVALUATION, GRADING & AUDIT TESTS
  // ==========================================
  describe("Evaluation, Grading & Roster Tracking", () => {
    it("allows course faculty to grade student submission with marks and feedback", async () => {
      // sub-cn-aarav is in asgn-cn-01 (Prof. Meera Sen)
      const graded = await AssignmentService.gradeSubmission(
        "demo-faculty-001",
        Role.FACULTY,
        "sub-cn-aarav",
        {
          marks: 48,
          feedback: "Great Wireshark trace analysis! Clear diagrams for fast retransmit.",
        }
      );

      expect(graded.status).toBe(SubmissionStatus.GRADED);
      expect(graded.marksObtained).toBe(48);
      expect(graded.feedback).toContain("Great Wireshark trace analysis");
      expect(graded.gradedBy).toBe("demo-faculty-001");
      expect(graded.gradedAt).toBeDefined();

      // Student notification sent
      const notifs = DEMO_NOTIFICATIONS_STORE.filter((n) =>
        n.title.includes("Assignment Graded")
      );
      expect(notifs.length).toBeGreaterThan(0);
    });

    it("rejects grading with marks exceeding assignment maxMarks", async () => {
      // asgn-cn-01 maxMarks is 50
      await expect(
        AssignmentService.gradeSubmission("demo-faculty-001", Role.FACULTY, "sub-cn-aarav", {
          marks: 60,
          feedback: "Awarding bonus marks beyond max limit",
        })
      ).rejects.toThrow(/Marks must be between 0 and 50/);
    });

    it("prevents unauthorized faculty from grading another faculty's course", async () => {
      // sub-cn-aarav belongs to Prof. Meera Sen (demo-faculty-001).
      // Prof. Rajesh Kulkarni (demo-faculty-002) attempts to grade it.
      await expect(
        AssignmentService.gradeSubmission("demo-faculty-002", Role.FACULTY, "sub-cn-aarav", {
          marks: 45,
          feedback: "Unauthorized grading attempt",
        })
      ).rejects.toThrow(/Security Violation: You are not authorized to grade/);
    });

    it("prevents students from grading any submissions", async () => {
      await expect(
        AssignmentService.gradeSubmission("demo-student-001", Role.STUDENT, "sub-cn-aarav", {
          marks: 50,
          feedback: "Student self-grading attempt",
        })
      ).rejects.toThrow(/Security Violation: You are not authorized to grade/);
    });

    it("generates student submission roster with enrolled students", async () => {
      const rosterData = await AssignmentService.getAssignmentSubmissions(
        "demo-faculty-001",
        Role.FACULTY,
        "asgn-dbms-01"
      );

      expect(rosterData.assignment.id).toBe("asgn-dbms-01");
      expect(rosterData.roster.length).toBe(5); // 5 enrolled students
      const diya = rosterData.roster.find((r) => r.studentId === "demo-student-002");
      expect(diya?.submissionStatus).toBe("SUBMITTED");
    });

    it("calculates real faculty analytics metrics accurately", async () => {
      const analytics = await AssignmentService.getFacultyAnalytics(
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(analytics.metrics.totalAssignments).toBeGreaterThan(0);
      expect(analytics.metrics.submissionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.metrics.submissionRate).toBeLessThanOrEqual(100);
      expect(analytics.scoreDistribution.length).toBe(5);
    });
  });
});
